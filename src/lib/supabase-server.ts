// SESSION-AWARE Supabase client for SSR pages/middleware/admin endpoints.
// Uses the PUBLIC anon key + the visitor's auth cookies, so every query
// made through this client is still subject to Row Level Security exactly
// as if it ran in the browser. This is the client admin pages should use
// for reads/writes -- RLS (is_admin()) is the real authorization boundary,
// not this file.
import { createServerClient, parseCookieHeader, type CookieOptions, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const cookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  secure: import.meta.env.PROD,
  httpOnly: true,
};

export function createSupabaseServerClient(
  request: Request,
  cookies: AstroCookies
): SupabaseClient<any, "public", any> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<any, "public", any>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll(): { name: string; value: string }[] {
        return parseCookieHeader(request.headers.get("Cookie") ?? "") as { name: string; value: string }[];
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...cookieOptions, ...options });
        });
      },
    },
  });
}
