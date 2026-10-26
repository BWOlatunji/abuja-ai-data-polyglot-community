-- ============================================================================
-- Abuja AI and Data Polyglot Community — core schema
-- ============================================================================
-- Design notes (see README.md "Database design" section for full rationale):
--
-- * Workflow/state fields (membership_status, publication_status, consent
--   status, achievement_type, etc.) are Postgres ENUMs because they drive
--   application logic and RLS policies.
-- * Free-text taxonomy fields (category, tags) are left as text/text[] so
--   organisers can introduce new categories from the admin UI without a
--   migration.
-- * Event speakers are stored as JSONB on the event row rather than a join
--   table — speakers are small, event-scoped records with no independent
--   identity or reuse across events, so a normalised table would add a join
--   for no real benefit ("avoid duplicated data and inconsistent
--   relationships" — this is the opposite failure mode, over-normalisation).
-- * "submissions" is a generic intake/review table shared by registration,
--   spotlight nominations, and project proposals, so there is one
--   consistent moderation queue and workflow for admins instead of three.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type membership_status as enum ('pending', 'active', 'suspended', 'removed');
create type profile_visibility as enum ('public', 'private');
create type experience_level as enum ('student', 'beginner', 'intermediate', 'advanced', 'expert');
create type career_stage as enum (
  'student', 'career_changer', 'early_career', 'mid_career', 'senior', 'freelance', 'other'
);
create type consent_type as enum ('directory_listing', 'spotlight_publication', 'communications');
create type consent_status as enum ('granted', 'withdrawn');
create type achievement_type as enum (
  'job', 'promotion', 'certification', 'award', 'grant', 'scholarship', 'competition',
  'talk', 'publication', 'open_source', 'project', 'volunteering', 'mentoring',
  'learning_journey', 'other'
);
create type publication_status as enum ('draft', 'pending_review', 'published', 'archived', 'rejected');
create type event_type as enum ('webinar', 'workshop', 'meetup', 'conference', 'office_hours', 'other');
create type event_status as enum ('scheduled', 'completed', 'cancelled', 'postponed');
create type submission_type as enum ('registration', 'spotlight_nomination', 'project_submission', 'contact_message');
create type submission_status as enum ('pending', 'under_review', 'approved', 'rejected', 'needs_info');

-- ---------------------------------------------------------------------------
-- admins — organisers with access to /admin. Intentionally separate from
-- "members": an organiser is not required to have (or be) a public directory
-- entry, and a member is never implicitly an admin.
-- ---------------------------------------------------------------------------

create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------

create table members (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 80),
  full_name text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  email text not null unique check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  professional_headline text check (char_length(professional_headline) <= 160),
  biography text check (char_length(biography) <= 2000),
  profile_image_url text,
  location text check (char_length(location) <= 120),
  experience_level experience_level,
  career_stage career_stage,
  learning_goals text check (char_length(learning_goals) <= 500),
  portfolio_url text,
  linkedin_url text,
  github_url text,
  membership_status membership_status not null default 'pending',
  profile_visibility profile_visibility not null default 'private',
  public_profile_approved boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_membership_status_idx on members (membership_status);
create index members_public_listing_idx on members (profile_visibility, public_profile_approved) where membership_status = 'active';

-- ---------------------------------------------------------------------------
-- skills + member_skills
-- ---------------------------------------------------------------------------

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null default 'general'
);

create table member_skills (
  member_id uuid not null references members (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  proficiency_level text check (proficiency_level in ('learning', 'comfortable', 'confident', 'expert')),
  primary key (member_id, skill_id)
);

create index member_skills_skill_idx on member_skills (skill_id);

-- ---------------------------------------------------------------------------
-- interest_groups + member_group_memberships
-- ---------------------------------------------------------------------------

create table interest_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  active_status boolean not null default true
);

create table member_group_memberships (
  member_id uuid not null references members (id) on delete cascade,
  group_id uuid not null references interest_groups (id) on delete cascade,
  participation_preferences jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key (member_id, group_id)
);

create index member_group_memberships_group_idx on member_group_memberships (group_id);

-- ---------------------------------------------------------------------------
-- consent_records — one row per consent *decision*, kept even after
-- withdrawal, so there is always an auditable history of what a member
-- agreed to and when. Never deleted or overwritten in place.
-- ---------------------------------------------------------------------------

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  consent_type consent_type not null,
  consent_status consent_status not null,
  policy_version text not null,
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index consent_records_member_idx on consent_records (member_id, consent_type, recorded_at desc);

-- ---------------------------------------------------------------------------
-- member_achievements — lightweight record of a recognised achievement.
-- A published achievement may optionally be expanded into a long-form
-- "spotlights" entry by an editor; not every achievement needs one.
-- ---------------------------------------------------------------------------

create table member_achievements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  achievement_type achievement_type not null,
  title text not null check (char_length(title) <= 160),
  description text check (char_length(description) <= 2000),
  achievement_date date,
  evidence_url text,
  image_url text,
  publication_status publication_status not null default 'pending_review',
  consent_record_id uuid references consent_records (id),
  created_at timestamptz not null default now()
);

create index member_achievements_status_idx on member_achievements (publication_status);
create index member_achievements_member_idx on member_achievements (member_id);

-- ---------------------------------------------------------------------------
-- spotlights
-- ---------------------------------------------------------------------------

create table spotlights (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members (id) on delete set null,
  achievement_id uuid references member_achievements (id) on delete set null,
  title text not null check (char_length(title) <= 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text check (char_length(summary) <= 300),
  content text not null,
  category text not null default 'general',
  image_url text,
  publication_status publication_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spotlights_status_published_idx on spotlights (publication_status, published_at desc);
create index spotlights_category_idx on spotlights (category);

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------

create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text check (char_length(excerpt) <= 300),
  content text not null,
  author_id uuid references admins (user_id) on delete set null,
  category text not null default 'general',
  tags text[] not null default '{}',
  cover_image_url text,
  publication_status publication_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_published_idx on articles (publication_status, published_at desc);
create index articles_category_idx on articles (category);
create index articles_tags_idx on articles using gin (tags);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null,
  event_type event_type not null default 'webinar',
  category text not null default 'general',
  start_at timestamptz not null,
  end_at timestamptz,
  timezone text not null default 'Africa/Lagos',
  venue_type text not null default 'online' check (venue_type in ('online', 'physical', 'hybrid')),
  venue_details text,
  registration_url text,
  speakers jsonb not null default '[]'::jsonb,
  featured_image_url text,
  status event_status not null default 'scheduled',
  recording_url text,
  resources jsonb not null default '[]'::jsonb,
  related_article_ids uuid[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_start_at_idx on events (start_at);
create index events_status_idx on events (status);

-- ---------------------------------------------------------------------------
-- projects + project_contributors
-- ---------------------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text check (char_length(summary) <= 300),
  description text not null,
  problem_statement text,
  technologies text[] not null default '{}',
  repository_url text,
  demo_url text,
  documentation_url text,
  category text not null default 'general',
  publication_status publication_status not null default 'pending_review',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A contributor is either a member (member_id set) or an external
-- collaborator credited by name only (contributor_name set) - exactly one
-- of the two identifies them, enforced below.
create table project_contributors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  member_id uuid references members (id) on delete set null,
  contributor_name text,
  contributor_role text,
  constraint project_contributors_identity_chk check (
    (member_id is not null) <> (contributor_name is not null)
  )
);

create index project_contributors_member_idx on project_contributors (member_id);
create index project_contributors_project_idx on project_contributors (project_id);
create unique index project_contributors_unique_member_idx
  on project_contributors (project_id, member_id) where member_id is not null;
create unique index project_contributors_unique_name_idx
  on project_contributors (project_id, contributor_name) where contributor_name is not null;

-- ---------------------------------------------------------------------------
-- submissions — shared moderation queue for registrations, spotlight
-- nominations, project proposals, and contact messages.
-- ---------------------------------------------------------------------------

create table submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type submission_type not null,
  member_id uuid references members (id) on delete set null,
  payload jsonb not null,
  status submission_status not null default 'pending',
  admin_notes text,
  reviewed_by uuid references admins (user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_status_idx on submissions (submission_type, status, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger — applied to every table that tracks it
-- ---------------------------------------------------------------------------

create function set_updated_at() returns trigger
  language plpgsql
  as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_set_updated_at before update on members
  for each row execute function set_updated_at();
create trigger spotlights_set_updated_at before update on spotlights
  for each row execute function set_updated_at();
create trigger articles_set_updated_at before update on articles
  for each row execute function set_updated_at();
create trigger events_set_updated_at before update on events
  for each row execute function set_updated_at();
create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger submissions_set_updated_at before update on submissions
  for each row execute function set_updated_at();
