import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .eq("invited_by", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ invites: invites || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const code = generateCode();

  const { error } = await supabase.from("invites").insert({
    invited_by: user.id,
    email: email.trim().toLowerCase(),
    code,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send invite email (best-effort)
  try {
    const inviterName = profile?.display_name || "Someone";
    await sendInviteEmail(email.trim().toLowerCase(), code, inviterName);
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }

  return NextResponse.json({ code });
}
