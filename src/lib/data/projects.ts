import { getPublicSupabase } from "../supabase-public";
import { sampleProjects } from "../sample-data";

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string;
  technologies: string[];
  repository_url: string | null;
  demo_url: string | null;
  category: string;
  published_at: string;
  contributors: Array<{ name: string; role: string | null }>;
  isSample?: boolean;
}

// See the comment in data/members.ts: embedding `members` via PostgREST
// relationship syntax fails for anon (column-grant vs. embed-privilege
// mismatch). project_contributors itself has no column restriction so it
// can be embedded directly, but the nested members.display_name cannot -
// that's resolved with a separate explicit query instead.
async function attachContributors(supabase: ReturnType<typeof getPublicSupabase>, projects: any[]) {
  const projectIds = projects.map((p) => p.id);
  const contributorsByProject = new Map<string, Array<{ name: string; role: string | null }>>();
  if (!supabase || projectIds.length === 0) {
    return projects.map((p) => ({ ...p, contributors: [] })) as PublicProject[];
  }

  const { data: contributorRows } = await supabase
    .from("project_contributors")
    .select("project_id, member_id, contributor_name, contributor_role")
    .in("project_id", projectIds);

  const rows = (contributorRows ?? []) as any[];
  const memberIds = [...new Set(rows.map((r) => r.member_id).filter(Boolean))];

  const memberNameById = new Map<string, string>();
  if (memberIds.length > 0) {
    const { data: memberRows } = await supabase.from("members").select("id, display_name").in("id", memberIds);
    for (const m of (memberRows ?? []) as any[]) memberNameById.set(m.id, m.display_name);
  }

  for (const row of rows) {
    const name = row.member_id ? memberNameById.get(row.member_id) : row.contributor_name;
    if (!name) continue;
    const list = contributorsByProject.get(row.project_id) ?? [];
    list.push({ name, role: row.contributor_role });
    contributorsByProject.set(row.project_id, list);
  }

  return projects.map((p) => ({
    ...p,
    technologies: p.technologies ?? [],
    contributors: contributorsByProject.get(p.id) ?? [],
  })) as PublicProject[];
}

export async function listPublishedProjects(category?: string): Promise<{ projects: PublicProject[]; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { projects: sampleProjects.map((p) => ({ ...p, isSample: true })), isSample: true };
  }

  let query = supabase
    .from("projects")
    .select("id, title, slug, summary, description, technologies, repository_url, demo_url, category, published_at")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error || !data) return { projects: [], isSample: false };

  const projects = await attachContributors(supabase, data);
  return { projects, isSample: false };
}

export async function getProjectBySlug(slug: string): Promise<{ project: PublicProject | null; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    const match = sampleProjects.find((p) => p.slug === slug);
    return { project: match ? { ...match, isSample: true } : null, isSample: true };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, summary, description, technologies, repository_url, demo_url, category, published_at")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error || !data) return { project: null, isSample: false };

  const [project] = await attachContributors(supabase, [data]);
  return { project, isSample: false };
}
