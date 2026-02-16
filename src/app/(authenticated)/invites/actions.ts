"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";

const INVITE_LIMITS: Record<string, number> = {
  free: 5,
  premium: 20,
  creator: 999999,
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createInvite(email: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check plan limits
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, role, display_name")
    .eq("id", user.id)
    .single();

  const limit = profile?.role === "creator"
    ? INVITE_LIMITS.creator
    : INVITE_LIMITS[profile?.plan || "free"];

  const { count } = await supabase
    .from("invites")
    .select("id", { count: "exact", head: true })
    .eq("invited_by", user.id);

  if ((count || 0) >= limit) {
    return {
      error: `You've used all ${limit} invite codes. ${profile?.plan === "free" ? "Upgrade to premium for more." : ""}`,
    };
  }

  const code = generateCode();

  const { error } = await supabase.from("invites").insert({
    invited_by: user.id,
    email: email.trim().toLowerCase(),
    code,
  });

  if (error) return { error: error.message };

  // Send invite email (best-effort)
  try {
    const inviterName = profile?.display_name || "Someone";
    await sendInviteEmail(email.trim().toLowerCase(), code, inviterName);
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }

  revalidatePath("/invites");
  return { code };
}
