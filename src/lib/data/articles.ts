import { getPublicSupabase } from "../supabase-public";
import { sampleArticles } from "../sample-data";

export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  published_at: string;
  isSample?: boolean;
}

export async function listPublishedArticles(opts: { category?: string; search?: string } = {}): Promise<{
  articles: PublicArticle[];
  isSample: boolean;
}> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { articles: sampleArticles.map((a) => ({ ...a, isSample: true })), isSample: true };
  }

  let query = supabase
    .from("articles")
    .select("id, title, slug, excerpt, content, category, tags, cover_image_url, published_at")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });

  if (opts.category) query = query.eq("category", opts.category);
  if (opts.search) query = query.ilike("title", `%${opts.search}%`);

  const { data, error } = await query;
  if (error || !data) return { articles: [], isSample: false };
  return { articles: data as PublicArticle[], isSample: false };
}

export async function getArticleBySlug(slug: string): Promise<{ article: PublicArticle | null; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    const match = sampleArticles.find((a) => a.slug === slug);
    return { article: match ? { ...match, isSample: true } : null, isSample: true };
  }

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, content, category, tags, cover_image_url, published_at")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error || !data) return { article: null, isSample: false };
  return { article: data as PublicArticle, isSample: false };
}

export async function listRelatedArticles(category: string, excludeSlug: string, limit = 3): Promise<PublicArticle[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return sampleArticles.filter((a) => a.slug !== excludeSlug).slice(0, limit) as PublicArticle[];

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, content, category, tags, cover_image_url, published_at")
    .eq("publication_status", "published")
    .eq("category", category)
    .neq("slug", excludeSlug)
    .limit(limit);

  if (error || !data) return [];
  return data as PublicArticle[];
}
