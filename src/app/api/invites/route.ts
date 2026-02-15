import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, role")
    .eq("id", user.id)
    .single();

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .eq("invited_by", user.id)
    .order("created_at", { ascending: false });

  const limit =
    profile?.role === "creator"
      ? "unlimited"
      : profile?.plan === "premium"
        ? 20
        : 5;
  const used = (invites || []).length;

  return NextResponse.json({ invites: invites || [], limit, used });
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
    .select("plan, role")
    .eq("id", user.id)
    .single();

  const limit =
    profile?.role === "creator"
      ? INVITE_LIMITS.creator
      : INVITE_LIMITS[profile?.plan || "free"];

  const { count } = await supabase
    .from("invites")
    .select("id", { count: "exact", head: true })
    .eq("invited_by", user.id);

  if ((count || 0) >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} invite codes. ${profile?.plan === "free" ? "Upgrade to premium for more." : ""}`,
      },
      { status: 403 }
    );
  }

  const code = generateCode();

  const { error } = await supabase.from("invites").insert({
    invited_by: user.id,
    email: email.trim().toLowerCase(),
    code,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code });
}
