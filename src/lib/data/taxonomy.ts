import { getPublicSupabase } from "../supabase-public";

export interface SkillOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export interface GroupOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const fallbackSkills: SkillOption[] = [
  { id: "sample-skill-python", name: "Python", slug: "python", category: "programming" },
  { id: "sample-skill-r", name: "R", slug: "r", category: "programming" },
  { id: "sample-skill-sql", name: "SQL", slug: "sql", category: "programming" },
  { id: "sample-skill-powerbi", name: "Power BI", slug: "power-bi", category: "bi-tools" },
  { id: "sample-skill-ml", name: "Machine Learning", slug: "machine-learning", category: "ai-ml" },
];

const fallbackGroups: GroupOption[] = [
  {
    id: "sample-group-python",
    name: "Python for Data Analysis",
    slug: "python-data-analysis",
    description: "Weekly practice group for pandas, numpy, and visualisation.",
  },
  {
    id: "sample-group-ml",
    name: "Machine Learning Study Circle",
    slug: "ml-study-circle",
    description: "Reading group working through applied ML courses together.",
  },
];

export async function listSkills(): Promise<SkillOption[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return fallbackSkills;
  const { data, error } = await supabase.from("skills").select("id, name, slug, category").order("name");
  if (error || !data) return fallbackSkills;
  return data as SkillOption[];
}

export async function listActiveGroups(): Promise<GroupOption[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return fallbackGroups;
  const { data, error } = await supabase
    .from("interest_groups")
    .select("id, name, slug, description")
    .eq("active_status", true)
    .order("name");
  if (error || !data) return fallbackGroups;
  return data as GroupOption[];
}
