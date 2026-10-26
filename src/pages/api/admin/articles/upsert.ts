import type { APIRoute } from "astro";
import { slugify } from "../../../../lib/utils";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const publicationStatus = String(form.get("publication_status") ?? "draft");

  if (!title) return redirect("/admin/articles?error=missing_title");

  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const record: Record<string, unknown> = {
    title,
    excerpt: String(form.get("excerpt") ?? "").trim() || null,
    content: String(form.get("content") ?? "").trim(),
    category: String(form.get("category") ?? "general").trim() || "general",
    tags,
    cover_image_url: String(form.get("cover_image_url") ?? "").trim() || null,
    author_id: user?.id ?? null,
    publication_status: publicationStatus,
    published_at: publicationStatus === "published" ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await locals.supabase.from("articles").update(record).eq("id", id);
    if (error) {
      console.error("article update error", error);
      return redirect("/admin/articles?error=save_failed");
    }
  } else {
    record.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await locals.supabase.from("articles").insert(record);
    if (error) {
      console.error("article insert error", error);
      return redirect("/admin/articles?error=save_failed");
    }
  }

  return redirect("/admin/articles?success=1");
};
