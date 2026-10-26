import type { APIRoute } from "astro";

export const prerender = false;

// Server-enforced by middleware (locals.isAdmin) AND by RLS (is_admin()
// policy on members) - two independent layers, neither relies on the
// frontend hiding a button.
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const action = String(form.get("action") ?? "");

  if (!id) return redirect("/admin/members?error=missing_id");

  const updates: Record<string, unknown> = {};
  if (action === "approve_membership") updates.membership_status = "active";
  if (action === "suspend_membership") updates.membership_status = "suspended";
  if (action === "remove_membership") updates.membership_status = "removed";
  if (action === "approve_profile") updates.public_profile_approved = true;
  if (action === "revoke_profile") updates.public_profile_approved = false;

  if (Object.keys(updates).length === 0) return redirect("/admin/members?error=unknown_action");

  const { error } = await locals.supabase.from("members").update(updates).eq("id", id);

  if (error) {
    console.error("admin member update error", error);
    return redirect("/admin/members?error=update_failed");
  }

  return redirect("/admin/members?success=1");
};
