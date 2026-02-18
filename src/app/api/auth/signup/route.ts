import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { email, password, inviteCode } = await request.json();

  if (!email || !password || !inviteCode) {
    return NextResponse.json(
      { error: "Email, password, and invite code are required" },
      { status: 400 }
    );
  }

  const code = inviteCode.trim().toUpperCase();
  const adminClient = createAdminClient();

  // Validate invite code
  const { data: invite } = await adminClient
    .from("invites")
    .select("id, used_at")
    .eq("code", code)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }
  if (invite.used_at) {
    return NextResponse.json(
      { error: "This invite code has already been used" },
      { status: 400 }
    );
  }

  // Create user with admin API — auto-confirms email since invite code is the verification
  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { invite_code: code },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Mark invite as used
  await adminClient
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
