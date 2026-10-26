// PRIVILEGED Supabase client using the service-role key. This key bypasses
// Row Level Security entirely.
//
// RULES:
//   1. Import this ONLY from files under src/pages/api/** (server endpoints
//      that run on Netlify Functions, never shipped to the browser).
//   2. Never import it from a .astro component body that could end up in a
//      client:* island, and never log or echo SUPABASE_SERVICE_ROLE_KEY.
//   3. Use it only for the specific public-intake writes that anon
//      deliberately cannot perform directly (registration, submissions,
//      consent records) -- see supabase/migrations/0002_rls_and_grants.sql.
//      Everything else should go through supabase-server.ts so RLS still
//      applies.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// No generated Database types are wired in yet (see README "Generating
// typed Supabase clients"), so the client is intentionally typed `any`
// here rather than fighting the default `never` row types that come from
// an untyped schema generic.
let cached: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any, "public", any> {
  if (cached) return cached;

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role is not configured. Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as server-only environment variables."
    );
  }

  cached = createClient<any, "public", any>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
