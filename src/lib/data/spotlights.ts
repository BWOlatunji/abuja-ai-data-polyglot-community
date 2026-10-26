import { getPublicSupabase } from "../supabase-public";
import { sampleSpotlights } from "../sample-data";

export interface PublicSpotlight {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category: string;
  image_url: string | null;
  published_at: string;
  member: { display_name: string; slug: string } | null;
  isSample?: boolean;
}

// See the comment in data/members.ts: embedding `members` via PostgREST
// relationship syntax fails for anon (column-grant vs. embed-privilege
// mismatch), so member attribution is resolved with a second explicit
// query instead.
async function attachMemberAttribution(supabase: ReturnType<typeof getPublicSupabase>, rows: any[]) {
  const memberIds = [...new Set(rows.map((r) => r.member_id).filter(Boolean))];
  const byId = new Map<string, { display_name: string; slug: string }>();
  if (supabase && memberIds.length > 0) {
    const { data } = await supabase.from("members").select("id, display_name, slug").in("id", memberIds);
    for (const m of (data ?? []) as any[]) byId.set(m.id, { display_name: m.display_name, slug: m.slug });
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    category: row.category,
    image_url: row.image_url,
    published_at: row.published_at,
    member: row.member_id ? byId.get(row.member_id) ?? null : null,
  })) as PublicSpotlight[];
}

export async function listPublishedSpotlights(category?: string): Promise<{ spotlights: PublicSpotlight[]; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { spotlights: sampleSpotlights.map((s) => ({ ...s, isSample: true })), isSample: true };
  }

  let query = supabase
    .from("spotlights")
    .select("id, title, slug, summary, content, category, image_url, published_at, member_id")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error || !data) return { spotlights: [], isSample: false };

  const spotlights = await attachMemberAttribution(supabase, data);
  return { spotlights, isSample: false };
}

export async function getSpotlightBySlug(slug: string): Promise<{ spotlight: PublicSpotlight | null; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    const match = sampleSpotlights.find((s) => s.slug === slug);
    return { spotlight: match ? { ...match, isSample: true } : null, isSample: true };
  }

  const { data, error } = await supabase
    .from("spotlights")
    .select("id, title, slug, summary, content, category, image_url, published_at, member_id")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error || !data) return { spotlight: null, isSample: false };

  const [spotlight] = await attachMemberAttribution(supabase, [data]);
  return { spotlight, isSample: false };
}
