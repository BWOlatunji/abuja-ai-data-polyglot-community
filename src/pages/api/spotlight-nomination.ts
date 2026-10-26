import type { APIRoute } from "astro";
import { spotlightNominationSchema } from "../../lib/validation";
import { getSupabaseAdmin } from "../../lib/supabase-admin";
import { isRateLimited, getClientIp } from "../../lib/rate-limit";
import { verifyTurnstile } from "../../lib/turnstile";
import { isSupabaseConfigured } from "../../lib/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!isSupabaseConfigured) {
    return redirect("/spotlights?error=not_configured#nominate");
  }

  const ip = getClientIp(request);
  if (isRateLimited(`spotlight-nomination:${ip}`, 5, 10 * 60 * 1000)) {
    return redirect("/spotlights?error=rate_limited#nominate");
  }

  const form = await request.formData();
  const turnstileOk = await verifyTurnstile(form.get("cf-turnstile-response") as string | null, ip);
  if (!turnstileOk) return redirect("/spotlights?error=bot_check_failed#nominate");

  const parsed = spotlightNominationSchema.safeParse({
    nominatorName: form.get("nominatorName"),
    nominatorEmail: form.get("nominatorEmail"),
    isSelfNomination: form.get("isSelfNomination") === "on",
    nomineeName: form.get("nomineeName"),
    nomineeEmail: form.get("nomineeEmail"),
    achievementType: form.get("achievementType"),
    title: form.get("title"),
    description: form.get("description"),
    achievementDate: form.get("achievementDate"),
    evidenceUrl: form.get("evidenceUrl"),
    consentToPublish: form.get("consentToPublish") === "on",
    website: form.get("website") ?? "",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return redirect(`/spotlights?error=validation&message=${encodeURIComponent(message)}#nominate`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("submissions").insert({
    submission_type: "spotlight_nomination",
    payload: { ...parsed.data, website: undefined },
    status: "pending",
  });

  if (error) {
    console.error("spotlight nomination insert error", error);
    return redirect("/spotlights?error=server_error#nominate");
  }

  return redirect("/spotlights?success=1#nominate");
};
