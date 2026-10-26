import type { APIRoute } from "astro";
import { slugify } from "../../../../lib/utils";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const publicationStatus = String(form.get("publication_status") ?? "draft");

  if (!title) return redirect("/admin/projects?error=missing_title");

  const technologies = String(form.get("technologies") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const record: Record<string, unknown> = {
    title,
    summary: String(form.get("summary") ?? "").trim() || null,
    description: String(form.get("description") ?? "").trim(),
    problem_statement: String(form.get("problem_statement") ?? "").trim() || null,
    technologies,
    repository_url: String(form.get("repository_url") ?? "").trim() || null,
    demo_url: String(form.get("demo_url") ?? "").trim() || null,
    category: String(form.get("category") ?? "general").trim() || "general",
    publication_status: publicationStatus,
    published_at: publicationStatus === "published" ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await locals.supabase.from("projects").update(record).eq("id", id);
    if (error) {
      console.error("project update error", error);
      return redirect("/admin/projects?error=save_failed");
    }
  } else {
    record.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await locals.supabase.from("projects").insert(record);
    if (error) {
      console.error("project insert error", error);
      return redirect("/admin/projects?error=save_failed");
    }
  }

  return redirect("/admin/projects?success=1");
};
