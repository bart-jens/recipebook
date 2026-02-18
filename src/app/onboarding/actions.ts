"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const displayName = (formData.get("displayName") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const avatarUrl = formData.get("avatarUrl") as string | null;

  if (!displayName) return { error: "Display name is required" };
  if (!username) return { error: "Username is required" };

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: "Username must be 3-30 characters, lowercase letters, numbers, and underscores only" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      display_name: displayName,
      username,
      avatar_url: avatarUrl || undefined,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "This username is already taken" };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/recipes");
}

export async function checkUsername(username: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { available: false };

  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .neq("id", user.id)
    .single();

  return { available: !data };
}
