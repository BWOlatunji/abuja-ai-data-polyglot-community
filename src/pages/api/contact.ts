import type { APIRoute } from "astro";
import { contactFormSchema } from "../../lib/validation";
import { getSupabaseAdmin } from "../../lib/supabase-admin";
import { isRateLimited, getClientIp } from "../../lib/rate-limit";
import { verifyTurnstile } from "../../lib/turnstile";
import { isSupabaseConfigured } from "../../lib/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!isSupabaseConfigured) {
    return redirect("/contact?error=not_configured");
  }

  const ip = getClientIp(request);
  if (isRateLimited(`contact:${ip}`, 8, 10 * 60 * 1000)) {
    return redirect("/contact?error=rate_limited");
  }

  const form = await request.formData();
  const turnstileOk = await verifyTurnstile(form.get("cf-turnstile-response") as string | null, ip);
  if (!turnstileOk) return redirect("/contact?error=bot_check_failed");

  const parsed = contactFormSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    subject: form.get("subject"),
    message: form.get("message"),
    website: form.get("website") ?? "",
  });

  if (!parsed.success) {
    return redirect("/contact?error=validation");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("submissions").insert({
    submission_type: "contact_message",
    payload: { ...parsed.data, website: undefined },
    status: "pending",
  });

  if (error) {
    console.error("contact insert error", error);
    return redirect("/contact?error=server_error");
  }

  return redirect("/contact?success=1");
};
