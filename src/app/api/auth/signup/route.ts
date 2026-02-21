import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { email, password, inviteCode } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const code = inviteCode?.trim().toUpperCase() || "";

  // If an invite code is provided, validate it
  let invite: { id: string; used_at: string | null } | null = null;
  if (code) {
    const { data } = await adminClient
      .from("invites")
      .select("id, used_at")
      .eq("code", code)
      .single();

    if (!data) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }
    if (data.used_at) {
      return NextResponse.json(
        { error: "This invite code has already been used" },
        { status: 400 }
      );
    }
    invite = data;
  }

  // Create user with admin API — auto-confirms email
  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...(code ? { user_metadata: { invite_code: code } } : {}),
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Mark invite as used (if one was provided)
  if (invite) {
    await adminClient
      .from("invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  return NextResponse.json({ success: true });
}
