"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const displayName = (formData.get("display_name") as string)?.trim();
  if (!displayName) return { error: "Display name is required" };

  const bio = (formData.get("bio") as string)?.trim() || null;

  const { error } = await supabase
    .from("user_profiles")
    .update({ display_name: displayName, bio })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

export async function followUser(userId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, following_id: userId });

  if (error && !error.message.includes("duplicate")) {
    return { error: error.message };
  }

  revalidatePath(`/profile/${userId}`);
}

export async function unfollowUser(userId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/profile/${userId}`);
}
