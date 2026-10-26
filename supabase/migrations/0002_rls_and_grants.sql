-- ============================================================================
-- Row Level Security + column-level grants
-- ============================================================================
-- Threat model assumption: the only Supabase Auth users in this system are
-- admins/editors who log in at /admin. There is no public member login flow
-- (members never hold an authenticated session), so the Postgres
-- "authenticated" role is effectively "logged-in organiser" and the
-- "anon" role is "anyone using the public site, including through the
-- anon key shipped to the browser". Policies below are written on that
-- basis; if self-service member login is added later, the `authenticated`
-- grants/policies MUST be revisited (see README "Security model").
--
-- Defence in depth for private fields (members.email, members.full_name,
-- members.admin_notes): even though RLS restricts which *rows* anon can
-- see, Postgres column-level GRANT/REVOKE additionally restricts which
-- *columns* anon can see, so a row-level policy mistake alone cannot leak
-- email addresses through the anon key.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- is_admin() helper — SECURITY DEFINER so it can check the admins table
-- without being blocked by the admins table's own RLS, and so policies on
-- every other table can call it without re-querying admins under their own
-- (sometimes anon) privileges.
-- ---------------------------------------------------------------------------

create function is_admin(uid uuid) returns boolean
  language sql
  security definer
  set search_path = public
  stable
as $$
  select exists (select 1 from admins where user_id = uid);
$$;

revoke all on function is_admin(uuid) from public;
grant execute on function is_admin(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------

alter table admins enable row level security;

create policy "Admins can view the admin list" on admins
  for select to authenticated
  using (is_admin(auth.uid()));

-- No insert/update/delete policy for any client role: new admins are
-- provisioned only via the service-role bootstrap script (see
-- scripts/create-first-admin and README "First administrator").

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------

alter table members enable row level security;

create policy "Public can view approved public members" on members
  for select to anon, authenticated
  using (
    membership_status = 'active'
    and profile_visibility = 'public'
    and public_profile_approved = true
  );

-- Directory listing and spotlight/project attribution are governed by
-- *separate* consent records (see consent_records / consent_type), so a
-- member who opted into a spotlight but NOT the public directory must
-- still be nameable on that published spotlight/project. These two
-- policies grant that narrow visibility without exposing the member
-- anywhere else; the column grant below still hides email/full_name/etc.
create policy "Public can view members attributed in published spotlights" on members
  for select to anon, authenticated
  using (
    exists (
      select 1 from spotlights s
      where s.member_id = members.id and s.publication_status = 'published'
    )
  );

create policy "Public can view members credited on published projects" on members
  for select to anon, authenticated
  using (
    exists (
      select 1 from project_contributors pc
      join projects p on p.id = pc.project_id
      where pc.member_id = members.id and p.publication_status = 'published'
    )
  );

create policy "Admins have full access to members" on members
  for all to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

revoke all on members from anon, authenticated;

-- Columns visible to anyone (including anon) for rows the policy above
-- already restricts to approved + public + active members. Private columns
-- (email, full_name, admin_notes, membership_status, profile_visibility,
-- public_profile_approved) are deliberately NOT granted here.
grant select (
  id, display_name, slug, professional_headline, biography, profile_image_url,
  location, experience_level, career_stage, portfolio_url, linkedin_url,
  github_url, created_at
) on members to anon, authenticated;

-- Admins (the only "authenticated" users in this system) get full column
-- access; row access is still gated by the policy above via is_admin().
grant select, insert, update, delete on members to authenticated;

-- ---------------------------------------------------------------------------
-- skills / interest_groups — public reference data, read-only for everyone
-- except admins.
-- ---------------------------------------------------------------------------

alter table skills enable row level security;
alter table interest_groups enable row level security;

create policy "Anyone can read skills" on skills for select to anon, authenticated using (true);
create policy "Admins manage skills" on skills for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Anyone can read active interest groups" on interest_groups
  for select to anon, authenticated using (active_status = true or is_admin(auth.uid()));
create policy "Admins manage interest groups" on interest_groups for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

grant select on skills, interest_groups to anon, authenticated;
grant insert, update, delete on skills, interest_groups to authenticated;

-- ---------------------------------------------------------------------------
-- member_skills / member_group_memberships — used to power directory
-- filters. Expose only the linkage for members who are already public;
-- joining through members' own RLS filters out everyone else.
-- ---------------------------------------------------------------------------

alter table member_skills enable row level security;
alter table member_group_memberships enable row level security;

create policy "Public can view skills of public members" on member_skills
  for select to anon, authenticated
  using (
    exists (
      select 1 from members m
      where m.id = member_skills.member_id
        and m.membership_status = 'active'
        and m.profile_visibility = 'public'
        and m.public_profile_approved = true
    )
    or is_admin(auth.uid())
  );
create policy "Admins manage member_skills" on member_skills for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Public can view groups of public members" on member_group_memberships
  for select to anon, authenticated
  using (
    exists (
      select 1 from members m
      where m.id = member_group_memberships.member_id
        and m.membership_status = 'active'
        and m.profile_visibility = 'public'
        and m.public_profile_approved = true
    )
    or is_admin(auth.uid())
  );
create policy "Admins manage member_group_memberships" on member_group_memberships for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

grant select on member_skills, member_group_memberships to anon, authenticated;
grant insert, update, delete on member_skills, member_group_memberships to authenticated;

-- ---------------------------------------------------------------------------
-- consent_records — never readable by anon/authenticated clients. Only
-- server-side code using the service-role key (bypasses RLS) writes and
-- reads these, plus admins may need read access for support/audit.
-- ---------------------------------------------------------------------------

alter table consent_records enable row level security;

create policy "Admins can view consent records" on consent_records
  for select to authenticated using (is_admin(auth.uid()));

revoke all on consent_records from anon, authenticated;
grant select on consent_records to authenticated;

-- ---------------------------------------------------------------------------
-- member_achievements — private until published; public read limited to
-- published rows, and even then only via the spotlights table in practice.
-- Kept lockable here too for defence in depth and for admin review UI.
-- ---------------------------------------------------------------------------

alter table member_achievements enable row level security;

create policy "Public can view published achievements" on member_achievements
  for select to anon, authenticated
  using (publication_status = 'published');
create policy "Admins manage achievements" on member_achievements for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

revoke all on member_achievements from anon, authenticated;
grant select (id, member_id, achievement_type, title, description, achievement_date, evidence_url, image_url)
  on member_achievements to anon, authenticated;
grant select, insert, update, delete on member_achievements to authenticated;

-- ---------------------------------------------------------------------------
-- spotlights / articles / events / projects — standard published-content
-- pattern: public sees only published rows, admins see and manage all.
-- ---------------------------------------------------------------------------

alter table spotlights enable row level security;
alter table articles enable row level security;
alter table events enable row level security;
alter table projects enable row level security;
alter table project_contributors enable row level security;

create policy "Public can view published spotlights" on spotlights
  for select to anon, authenticated using (publication_status = 'published');
create policy "Admins manage spotlights" on spotlights for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Public can view published articles" on articles
  for select to anon, authenticated using (publication_status = 'published');
create policy "Admins manage articles" on articles for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Public can view published events" on events
  for select to anon, authenticated using (status != 'cancelled' and published_at is not null);
create policy "Admins manage events" on events for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Public can view published projects" on projects
  for select to anon, authenticated using (publication_status = 'published');
create policy "Admins manage projects" on projects for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Public can view contributors of published projects" on project_contributors
  for select to anon, authenticated
  using (
    exists (select 1 from projects p where p.id = project_contributors.project_id and p.publication_status = 'published')
    or is_admin(auth.uid())
  );
create policy "Admins manage project_contributors" on project_contributors for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

grant select on spotlights, articles, events, projects, project_contributors to anon, authenticated;
grant insert, update, delete on spotlights, articles, events, projects, project_contributors to authenticated;

-- ---------------------------------------------------------------------------
-- submissions — write-only intake from the public (via service role in
-- server endpoints, never directly from the browser), read/update by
-- admins only.
-- ---------------------------------------------------------------------------

alter table submissions enable row level security;

create policy "Admins manage submissions" on submissions for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

revoke all on submissions from anon, authenticated;
grant select, update on submissions to authenticated;
-- Intentionally no insert/select/update grant for anon: all public-form
-- writes go through server endpoints using the service-role key, which
-- bypasses RLS and these grants entirely. This prevents bulk scripted
-- submission spam directly against the Supabase REST API.
