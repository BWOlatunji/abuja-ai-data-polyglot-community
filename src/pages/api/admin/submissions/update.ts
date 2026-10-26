import type { APIRoute } from "astro";

export const prerender = false;

const ALLOWED_STATUSES = new Set(["pending", "under_review", "approved", "rejected", "needs_info"]);

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  const adminNotes = String(form.get("admin_notes") ?? "");

  if (!id || !ALLOWED_STATUSES.has(status)) {
    return redirect("/admin/submissions?error=invalid");
  }

  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  const { error } = await locals.supabase
    .from("submissions")
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("admin submission update error", error);
    return redirect("/admin/submissions?error=update_failed");
  }

  return redirect("/admin/submissions?success=1");
};
