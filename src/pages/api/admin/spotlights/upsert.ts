import type { APIRoute } from "astro";
import { slugify } from "../../../../lib/utils";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const publicationStatus = String(form.get("publication_status") ?? "draft");

  if (!title) return redirect("/admin/spotlights?error=missing_title");

  const record: Record<string, unknown> = {
    title,
    summary: String(form.get("summary") ?? "").trim() || null,
    content: String(form.get("content") ?? "").trim(),
    category: String(form.get("category") ?? "general").trim() || "general",
    image_url: String(form.get("image_url") ?? "").trim() || null,
    member_id: String(form.get("member_id") ?? "").trim() || null,
    publication_status: publicationStatus,
    published_at: publicationStatus === "published" ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await locals.supabase.from("spotlights").update(record).eq("id", id);
    if (error) {
      console.error("spotlight update error", error);
      return redirect("/admin/spotlights?error=save_failed");
    }
  } else {
    record.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await locals.supabase.from("spotlights").insert(record);
    if (error) {
      console.error("spotlight insert error", error);
      return redirect("/admin/spotlights?error=save_failed");
    }
  }

  return redirect("/admin/spotlights?success=1");
};
