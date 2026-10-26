// Server-enforced admin authorization. This runs on EVERY request before
// any page or API route executes - hiding an /admin link in the frontend
// is never the security boundary here, this middleware (backed by RLS) is.
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "./lib/supabase-server";
import { isSupabaseConfigured } from "./lib/config";

const PROTECTED_PREFIXES = ["/admin"];
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);
const PROTECTED_API_PREFIXES = ["/api/admin"];
const PUBLIC_ADMIN_API_PATHS = new Set(["/api/admin/login"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, locals, redirect, url } = context;

  const isProtectedPage =
    PROTECTED_PREFIXES.some((p) => url.pathname.startsWith(p)) && !PUBLIC_ADMIN_PATHS.has(url.pathname);
  const isProtectedApi =
    PROTECTED_API_PREFIXES.some((p) => url.pathname.startsWith(p)) && !PUBLIC_ADMIN_API_PATHS.has(url.pathname);

  // Without Supabase configured there is no auth to check - admin access
  // must stay denied (not silently skipped) rather than crashing pages
  // that assume locals.supabase is present.
  if (!isSupabaseConfigured) {
    locals.supabase = null as any;
    locals.session = null;
    locals.isAdmin = false;

    if (isProtectedPage) return redirect(`/admin/login?next=${encodeURIComponent(url.pathname)}`);
    if (isProtectedApi) {
      return new Response(JSON.stringify({ error: "Supabase is not configured." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    return next();
  }

  const supabase = createSupabaseServerClient(request, cookies);
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let isAdmin = false;
  if (user) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(adminRow);
  }

  locals.supabase = supabase;
  locals.session = user ? ({ user } as any) : null;
  locals.isAdmin = isAdmin;

  if (isProtectedPage && !isAdmin) {
    return redirect(`/admin/login?next=${encodeURIComponent(url.pathname)}`);
  }

  if (isProtectedApi && !isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
});
