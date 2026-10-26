import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { isSupabaseConfigured } from "../../../lib/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");

  if (!isSupabaseConfigured) {
    return redirect(`/admin/login?error=not_configured&next=${encodeURIComponent(next)}`);
  }

  if (!email || !password) {
    return redirect(`/admin/login?error=missing&next=${encodeURIComponent(next)}`);
  }

  const supabase = createSupabaseServerClient(request, cookies);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return redirect(`/admin/login?error=not_admin&next=${encodeURIComponent(next)}`);
  }

  return redirect(next.startsWith("/admin") ? next : "/admin");
};
