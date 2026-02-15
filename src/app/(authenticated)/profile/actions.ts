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
  if (bio && bio.length > 300) return { error: "Bio must be 300 characters or less" };

  const isPrivate = formData.get("is_private") === "true";

  // Check if switching from private to public — auto-approve pending requests
  const { data: currentProfile } = await supabase
    .from("user_profiles")
    .select("is_private")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("user_profiles")
    .update({ display_name: displayName, bio, is_private: isPrivate })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Auto-approve all pending follow requests when switching to public
  if (currentProfile?.is_private && !isPrivate) {
    const { data: pendingRequests } = await supabase
      .from("follow_requests")
      .select("requester_id")
      .eq("target_id", user.id);

    if (pendingRequests && pendingRequests.length > 0) {
      // Insert all pending requesters as followers
      await supabase.from("user_follows").insert(
        pendingRequests.map((r) => ({
          follower_id: r.requester_id,
          following_id: user.id,
        }))
      );
      // Delete all pending requests
      await supabase
        .from("follow_requests")
        .delete()
        .eq("target_id", user.id);
    }
  }

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

  // Check if target is private
  const { data: targetProfile } = await supabase
    .from("user_profiles")
    .select("is_private")
    .eq("id", userId)
    .single();

  if (targetProfile?.is_private) {
    // Create a follow request instead
    const { error } = await supabase
      .from("follow_requests")
      .insert({ requester_id: user.id, target_id: userId });

    if (error && !error.message.includes("duplicate")) {
      return { error: error.message };
    }

    revalidatePath(`/profile/${userId}`);
    return { requested: true };
  }

  // Public profile: follow directly
  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, following_id: userId });

  if (error && !error.message.includes("duplicate")) {
    return { error: error.message };
  }

  revalidatePath(`/profile/${userId}`);
  return { followed: true };
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

export async function cancelFollowRequest(userId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("follow_requests")
    .delete()
    .eq("requester_id", user.id)
    .eq("target_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/profile/${userId}`);
}

export async function approveFollowRequest(requesterId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Insert the follow
  const { error: followError } = await supabase
    .from("user_follows")
    .insert({ follower_id: requesterId, following_id: user.id });

  if (followError && !followError.message.includes("duplicate")) {
    return { error: followError.message };
  }

  // Delete the request
  await supabase
    .from("follow_requests")
    .delete()
    .eq("requester_id", requesterId)
    .eq("target_id", user.id);

  revalidatePath("/profile");
  revalidatePath("/profile/requests");
}

export async function denyFollowRequest(requesterId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("follow_requests")
    .delete()
    .eq("requester_id", requesterId)
    .eq("target_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/profile/requests");
}
