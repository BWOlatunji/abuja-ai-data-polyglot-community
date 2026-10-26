import type { APIRoute } from "astro";
import { joinFormSchema } from "../../lib/validation";
import { getSupabaseAdmin } from "../../lib/supabase-admin";
import { slugify } from "../../lib/utils";
import { isRateLimited, getClientIp } from "../../lib/rate-limit";
import { verifyTurnstile } from "../../lib/turnstile";
import { PRIVACY_POLICY_VERSION, isSupabaseConfigured } from "../../lib/config";

export const prerender = false;

function boolFromCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!isSupabaseConfigured) {
    return redirect("/join?error=not_configured");
  }

  const ip = getClientIp(request);
  if (isRateLimited(`join:${ip}`, 5, 10 * 60 * 1000)) {
    return redirect("/join?error=rate_limited");
  }

  const form = await request.formData();

  const turnstileOk = await verifyTurnstile(form.get("cf-turnstile-response") as string | null, ip);
  if (!turnstileOk) return redirect("/join?error=bot_check_failed");

  const parsed = joinFormSchema.safeParse({
    displayName: form.get("displayName") ?? "",
    email: form.get("email") ?? "",
    headline: form.get("headline") ?? "",
    skills: form.getAll("skills[]"),
    groups: form.getAll("groups[]"),
    learningGoals: form.get("learningGoals") ?? "",
    experienceLevel: form.get("experienceLevel") ?? "",
    careerStage: form.get("careerStage") ?? "",
    location: form.get("location") ?? "",
    linkedinUrl: form.get("linkedinUrl") ?? "",
    githubUrl: form.get("githubUrl") ?? "",
    consentDirectoryListing: boolFromCheckbox(form.get("consentDirectoryListing")),
    consentSpotlight: boolFromCheckbox(form.get("consentSpotlight")),
    consentCommunications: boolFromCheckbox(form.get("consentCommunications")),
    consentPrivacyPolicy: boolFromCheckbox(form.get("consentPrivacyPolicy")),
    website: form.get("website") ?? "",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return redirect(`/join?error=validation&message=${encodeURIComponent(message)}`);
  }

  const input = parsed.data;
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.from("members").select("id").eq("email", input.email).maybeSingle();
  if (existing) {
    return redirect("/join?error=duplicate_email");
  }

  const slug = `${slugify(input.displayName)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: member, error: insertError } = await supabase
    .from("members")
    .insert({
      display_name: input.displayName,
      slug,
      email: input.email,
      professional_headline: input.headline ?? null,
      location: input.location ?? null,
      experience_level: input.experienceLevel ?? null,
      career_stage: input.careerStage ?? null,
      learning_goals: input.learningGoals ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      github_url: input.githubUrl ?? null,
      membership_status: "pending",
      profile_visibility: input.consentDirectoryListing ? "public" : "private",
      public_profile_approved: false,
    })
    .select("id")
    .single();

  if (insertError || !member) {
    console.error("join insert member error", insertError);
    return redirect("/join?error=server_error");
  }

  const memberId = member.id;

  if (input.skills.length > 0) {
    await supabase.from("member_skills").insert(input.skills.map((skillId) => ({ member_id: memberId, skill_id: skillId })));
  }
  if (input.groups.length > 0) {
    await supabase
      .from("member_group_memberships")
      .insert(input.groups.map((groupId) => ({ member_id: memberId, group_id: groupId })));
  }

  const consentRows = [
    { consent_type: "directory_listing", consent_status: input.consentDirectoryListing ? "granted" : "withdrawn" },
    { consent_type: "spotlight_publication", consent_status: input.consentSpotlight ? "granted" : "withdrawn" },
    { consent_type: "communications", consent_status: input.consentCommunications ? "granted" : "withdrawn" },
  ].map((row) => ({ ...row, member_id: memberId, policy_version: PRIVACY_POLICY_VERSION }));

  await supabase.from("consent_records").insert(consentRows);

  await supabase.from("submissions").insert({
    submission_type: "registration",
    member_id: memberId,
    payload: { ...input, website: undefined },
    status: "pending",
  });

  return redirect("/join?success=1");
};
