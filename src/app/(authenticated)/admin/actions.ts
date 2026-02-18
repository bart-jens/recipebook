"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };
  return { userId: user.id };
}

export async function deleteUser(targetUserId: string): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  // Check target is not an admin
  const { data: target } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", targetUserId)
    .single();

  if (target?.role === "admin") {
    return { error: "Cannot delete admin users" };
  }

  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return {};
}

export async function revokeInvite(inviteId: string): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  // Only allow revoking unused invites
  const { data: invite } = await admin
    .from("invites")
    .select("used_at")
    .eq("id", inviteId)
    .single();

  if (!invite) return { error: "Invite not found" };
  if (invite.used_at) return { error: "Cannot revoke a used invite" };

  const { error } = await admin.from("invites").delete().eq("id", inviteId);
  if (error) return { error: error.message };

  revalidatePath("/admin/invites");
  return {};
}
