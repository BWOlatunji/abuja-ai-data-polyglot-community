import type { APIRoute } from "astro";
import { slugify } from "../../../../lib/utils";

export const prerender = false;

// Converts an approved spotlight nomination or project submission into a
// *draft* record on the relevant table, so an editor still finishes and
// explicitly publishes it from the dedicated admin page (Spotlights /
// Projects) rather than content going live straight out of a public form.
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  if (!id) return redirect("/admin/submissions?error=missing_id");

  const { data: submission, error: fetchError } = await locals.supabase
    .from("submissions")
    .select("id, submission_type, payload, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !submission) return redirect("/admin/submissions?error=not_found");

  const payload = submission.payload as Record<string, any>;

  if (submission.submission_type === "spotlight_nomination") {
    const slug = `${slugify(payload.title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await locals.supabase.from("spotlights").insert({
      title: payload.title,
      slug,
      summary: String(payload.description ?? "").slice(0, 280),
      content: payload.description,
      category: payload.achievementType ?? "general",
      publication_status: "draft",
    });
    if (error) {
      console.error("publish spotlight draft error", error);
      return redirect("/admin/submissions?error=convert_failed");
    }
  } else if (submission.submission_type === "project_submission") {
    const slug = `${slugify(payload.title)}-${Math.random().toString(36).slice(2, 7)}`;
    const technologies = String(payload.technologies ?? "")
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
    const { error } = await locals.supabase.from("projects").insert({
      title: payload.title,
      slug,
      summary: payload.summary,
      description: payload.description,
      problem_statement: payload.problemStatement ?? null,
      technologies,
      repository_url: payload.repositoryUrl ?? null,
      demo_url: payload.demoUrl ?? null,
      category: payload.category ?? "general",
      publication_status: "draft",
    });
    if (error) {
      console.error("publish project draft error", error);
      return redirect("/admin/submissions?error=convert_failed");
    }
  } else {
    return redirect("/admin/submissions?error=not_convertible");
  }

  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  await locals.supabase
    .from("submissions")
    .update({ status: "approved", reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return redirect("/admin/submissions?success=converted");
};
