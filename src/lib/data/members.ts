import { getPublicSupabase } from "../supabase-public";
import { sampleMembers } from "../sample-data";

export interface DirectoryFilters {
  skillSlugs?: string[];
  groupSlugs?: string[];
  experienceLevel?: string;
  search?: string;
}

export interface PublicMember {
  id: string;
  display_name: string;
  slug: string;
  professional_headline: string | null;
  biography: string | null;
  profile_image_url: string | null;
  location: string | null;
  experience_level: string | null;
  career_stage: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  created_at: string;
  skills: string[];
  groups: string[];
  isSample?: boolean;
}

// Deliberately NOT using PostgREST relationship embeds (e.g.
// `.select("*, member_skills(skills(name))")`) here: PostgREST's embed
// resolution against `members` needs broader row access than the
// column-level GRANT in 0002_rls_and_grants.sql allows for anon, and
// fails with "permission denied for table members" even though every
// embedded/outer column requested is on the allow-list. Two plain
// queries + an in-memory join sidesteps that entirely and keeps the
// column-level privacy boundary intact.
const MEMBER_PUBLIC_COLUMNS =
  "id, display_name, slug, professional_headline, biography, profile_image_url, location, experience_level, career_stage, portfolio_url, linkedin_url, github_url, created_at";

async function attachSkillsAndGroups(supabase: ReturnType<typeof getPublicSupabase>, memberIds: string[]) {
  const skillsByMember = new Map<string, string[]>();
  const groupsByMember = new Map<string, string[]>();
  if (!supabase || memberIds.length === 0) return { skillsByMember, groupsByMember };

  const [skillsRes, groupsRes] = await Promise.all([
    supabase.from("member_skills").select("member_id, skills ( name )").in("member_id", memberIds),
    supabase.from("member_group_memberships").select("member_id, interest_groups ( name )").in("member_id", memberIds),
  ]);

  for (const row of (skillsRes.data ?? []) as any[]) {
    const name = row.skills?.name;
    if (!name) continue;
    const list = skillsByMember.get(row.member_id) ?? [];
    list.push(name);
    skillsByMember.set(row.member_id, list);
  }
  for (const row of (groupsRes.data ?? []) as any[]) {
    const name = row.interest_groups?.name;
    if (!name) continue;
    const list = groupsByMember.get(row.member_id) ?? [];
    list.push(name);
    groupsByMember.set(row.member_id, list);
  }

  return { skillsByMember, groupsByMember };
}

export async function listPublicMembers(filters: DirectoryFilters = {}): Promise<{
  members: PublicMember[];
  isSample: boolean;
}> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { members: sampleMembers.map((m) => ({ ...m, isSample: true })), isSample: true };
  }

  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_PUBLIC_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("listPublicMembers error", error);
    return { members: [], isSample: false };
  }

  const rows = data as any[];
  const { skillsByMember, groupsByMember } = await attachSkillsAndGroups(
    supabase,
    rows.map((r) => r.id)
  );

  let members: PublicMember[] = rows.map((row) => ({
    ...row,
    skills: skillsByMember.get(row.id) ?? [],
    groups: groupsByMember.get(row.id) ?? [],
  }));

  if (filters.experienceLevel) {
    members = members.filter((m) => m.experience_level === filters.experienceLevel);
  }
  if (filters.skillSlugs?.length) {
    members = members.filter((m) =>
      filters.skillSlugs!.every((slug) => m.skills.some((s) => s.toLowerCase().replace(/\s+/g, "-") === slug))
    );
  }
  if (filters.groupSlugs?.length) {
    members = members.filter((m) =>
      filters.groupSlugs!.every((slug) => m.groups.some((g) => g.toLowerCase().replace(/\s+/g, "-") === slug))
    );
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    members = members.filter(
      (m) =>
        m.display_name.toLowerCase().includes(q) ||
        m.professional_headline?.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  return { members, isSample: false };
}

export async function getPublicMemberBySlug(slug: string): Promise<{ member: PublicMember | null; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    const match = sampleMembers.find((m) => m.slug === slug);
    return { member: match ? { ...match, isSample: true } : null, isSample: true };
  }

  const { data, error } = await supabase.from("members").select(MEMBER_PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();

  if (error || !data) return { member: null, isSample: false };

  const row = data as any;
  const { skillsByMember, groupsByMember } = await attachSkillsAndGroups(supabase, [row.id]);

  return {
    member: {
      ...row,
      skills: skillsByMember.get(row.id) ?? [],
      groups: groupsByMember.get(row.id) ?? [],
    },
    isSample: false,
  };
}

export async function getMemberCount(): Promise<number | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}
