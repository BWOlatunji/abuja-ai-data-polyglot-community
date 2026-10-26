import { getPublicSupabase } from "../supabase-public";
import { sampleEvents } from "../sample-data";
import { isEventUpcoming } from "../utils";

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: string;
  category: string;
  start_at: string;
  end_at: string | null;
  timezone: string;
  venue_type: string;
  venue_details: string | null;
  registration_url: string | null;
  speakers: Array<{ name: string; bio?: string }>;
  featured_image_url: string | null;
  status: string;
  recording_url: string | null;
  resources: Array<{ label: string; url: string }>;
  isSample?: boolean;
}

export async function listEvents(): Promise<{ upcoming: PublicEvent[]; past: PublicEvent[]; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    const all = sampleEvents.map((e) => ({ ...e, isSample: true })) as PublicEvent[];
    return {
      upcoming: all.filter((e) => isEventUpcoming(e.start_at)),
      past: all.filter((e) => !isEventUpcoming(e.start_at)),
      isSample: true,
    };
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      `id, title, slug, description, event_type, category, start_at, end_at, timezone, venue_type,
       venue_details, registration_url, speakers, featured_image_url, status, recording_url, resources`
    )
    .not("published_at", "is", null)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });

  if (error || !data) return { upcoming: [], past: [], isSample: false };

  const all = data as unknown as PublicEvent[];
  return {
    upcoming: all.filter((e) => isEventUpcoming(e.start_at)),
    past: all.filter((e) => !isEventUpcoming(e.start_at)).reverse(),
    isSample: false,
  };
}

export async function getEventBySlug(slug: string): Promise<{ event: PublicEvent | null; isSample: boolean }> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    const match = sampleEvents.find((e) => e.slug === slug);
    return { event: match ? ({ ...match, isSample: true } as PublicEvent) : null, isSample: true };
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      `id, title, slug, description, event_type, category, start_at, end_at, timezone, venue_type,
       venue_details, registration_url, speakers, featured_image_url, status, recording_url, resources`
    )
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();

  if (error || !data) return { event: null, isSample: false };
  return { event: data as unknown as PublicEvent, isSample: false };
}
