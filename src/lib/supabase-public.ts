// Plain anon-key client for public, session-independent reads (home page,
// directory, blog, events, projects, spotlights). No cookies involved —
// every query here is subject to the same RLS policies/column grants an
// anonymous visitor's browser would get.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

// Typed `any` - see supabase-admin.ts for why.
let cached: SupabaseClient<any, "public", any> | null = null;

export function getPublicSupabase(): SupabaseClient<any, "public", any> | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;

  cached = createClient<any, "public", any>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  return cached;
}
