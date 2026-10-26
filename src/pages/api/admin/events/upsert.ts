import type { APIRoute } from "astro";
import { slugify } from "../../../../lib/utils";

export const prerender = false;

// WAT (Africa/Lagos) is UTC+1 year-round with no daylight-saving
// adjustments, so a "YYYY-MM-DDTHH:mm" value from a <input type="datetime-local">
// admin form can be converted to an exact UTC instant just by appending a
// fixed +01:00 offset - no timezone library needed.
function watLocalToIso(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}:00+01:00`).toISOString();
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const startAtLocal = String(form.get("start_at") ?? "");
  const endAtLocal = String(form.get("end_at") ?? "");

  if (!title || !startAtLocal) return redirect("/admin/events?error=missing_fields");

  let speakers: unknown = [];
  try {
    const raw = String(form.get("speakers_json") ?? "[]").trim();
    speakers = raw ? JSON.parse(raw) : [];
  } catch {
    speakers = [];
  }

  const status = String(form.get("status") ?? "scheduled");
  const shouldPublish = form.get("publish") === "on";

  const record: Record<string, unknown> = {
    title,
    description: String(form.get("description") ?? "").trim(),
    event_type: String(form.get("event_type") ?? "webinar"),
    category: String(form.get("category") ?? "general").trim() || "general",
    start_at: watLocalToIso(startAtLocal),
    end_at: watLocalToIso(endAtLocal),
    timezone: "Africa/Lagos",
    venue_type: String(form.get("venue_type") ?? "online"),
    venue_details: String(form.get("venue_details") ?? "").trim() || null,
    registration_url: String(form.get("registration_url") ?? "").trim() || null,
    speakers,
    featured_image_url: String(form.get("featured_image_url") ?? "").trim() || null,
    status,
    recording_url: String(form.get("recording_url") ?? "").trim() || null,
    published_at: shouldPublish ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await locals.supabase.from("events").update(record).eq("id", id);
    if (error) {
      console.error("event update error", error);
      return redirect("/admin/events?error=save_failed");
    }
  } else {
    record.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await locals.supabase.from("events").insert(record);
    if (error) {
      console.error("event insert error", error);
      return redirect("/admin/events?error=save_failed");
    }
  }

  return redirect("/admin/events?success=1");
};
