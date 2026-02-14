"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = createClient();

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

  // Create user
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { invite_code: code },
    },
  });

  if (signUpError) return { error: signUpError.message };

  // Mark invite as used
  await supabase
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  revalidatePath("/", "layout");
  redirect("/recipes");
}
