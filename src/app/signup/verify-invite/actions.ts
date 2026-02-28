"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function verifyOAuthInvite(formData: FormData) {
  const supabase = createClient();
  const adminClient = createAdminClient();
  const code = (formData.get("code") as string)?.trim().toUpperCase() || "";

  if (!code) {
    return { error: "Please enter your invite code" };
  }

  // Verify the current user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Validate invite code
  const { data: invite } = await supabase
    .from("invites")
    .select("id, used_at")
    .eq("code", code)
    .single();

  if (!invite) return { error: "Invalid invite code" };
  if (invite.used_at) return { error: "This invite code has already been used" };

  // Mark invite as used
  await adminClient
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  redirect("/recipes");
}

export async function cancelOAuthSignup() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login?error=invite_required");
}
