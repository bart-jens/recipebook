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
  const code = (formData.get("code") as string)?.trim().toUpperCase() || "";

  // If an invite code is provided, validate it
  let invite: { id: string; used_at: string | null } | null = null;
  if (code) {
    const { data } = await supabase
      .from("invites")
      .select("id, used_at")
      .eq("code", code)
      .single();

    if (!data) return { error: "Invalid invite code" };
    if (data.used_at) return { error: "This invite code has already been used" };
    invite = data;
  }

  // Create user with admin API — auto-confirms email
  const { error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      ...(code ? { user_metadata: { invite_code: code } } : {}),
    });

  if (createError) return { error: createError.message };

  // Mark invite as used (if one was provided)
  if (invite) {
    await adminClient
      .from("invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  // Sign in the user so they get a session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) return { error: signInError.message };

  revalidatePath("/", "layout");
  redirect("/recipes");
}
