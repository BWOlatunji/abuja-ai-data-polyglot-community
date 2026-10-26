import type { APIRoute } from "astro";
import { projectSubmissionSchema } from "../../lib/validation";
import { getSupabaseAdmin } from "../../lib/supabase-admin";
import { isRateLimited, getClientIp } from "../../lib/rate-limit";
import { verifyTurnstile } from "../../lib/turnstile";
import { isSupabaseConfigured } from "../../lib/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!isSupabaseConfigured) {
    return redirect("/projects?error=not_configured#submit");
  }

  const ip = getClientIp(request);
  if (isRateLimited(`project-submission:${ip}`, 5, 10 * 60 * 1000)) {
    return redirect("/projects?error=rate_limited#submit");
  }

  const form = await request.formData();
  const turnstileOk = await verifyTurnstile(form.get("cf-turnstile-response") as string | null, ip);
  if (!turnstileOk) return redirect("/projects?error=bot_check_failed#submit");

  const parsed = projectSubmissionSchema.safeParse({
    submitterName: form.get("submitterName"),
    submitterEmail: form.get("submitterEmail"),
    title: form.get("title"),
    summary: form.get("summary"),
    description: form.get("description"),
    problemStatement: form.get("problemStatement"),
    technologies: form.get("technologies"),
    repositoryUrl: form.get("repositoryUrl"),
    demoUrl: form.get("demoUrl"),
    category: form.get("category"),
    website: form.get("website") ?? "",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return redirect(`/projects?error=validation&message=${encodeURIComponent(message)}#submit`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("submissions").insert({
    submission_type: "project_submission",
    payload: { ...parsed.data, website: undefined },
    status: "pending",
  });

  if (error) {
    console.error("project submission insert error", error);
    return redirect("/projects?error=server_error#submit");
  }

  return redirect("/projects?success=1#submit");
};
