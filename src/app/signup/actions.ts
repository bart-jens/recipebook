"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signup(formData: FormData) {
  const supabase = createClient();
  const adminClient = createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const code = (formData.get("code") as string)?.trim().toUpperCase();

  if (!code) return { error: "Invite code is required" };

  // Validate invite code
  const { data: invite } = await supabase
    .from("invites")
    .select("id, used_at")
    .eq("code", code)
    .single();

  if (!invite) return { error: "Invalid invite code" };
  if (invite.used_at) return { error: "This invite code has already been used" };

  // Create user with admin API — auto-confirms email since invite code is the verification
  const { error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { invite_code: code },
    });

  if (createError) return { error: createError.message };

  // Mark invite as used
  await adminClient
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Sign in the user so they get a session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) return { error: signInError.message };

  revalidatePath("/", "layout");
  redirect("/recipes");
}
