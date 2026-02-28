import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const trimmed = code?.trim().toUpperCase() || "";

  if (!trimmed) {
    return NextResponse.json({ error: "Please enter your invite code" }, { status: 400 });
  }

  // Verify the caller is authenticated via Bearer token (mobile) or cookie (web)
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const adminClient = createAdminClient();

  let userId: string | null = null;
  if (token) {
    const { data: { user } } = await adminClient.auth.getUser(token);
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Validate invite code
  const { data: invite } = await adminClient
    .from("invites")
    .select("id, used_at")
    .eq("code", trimmed)
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

  // Mark invite as used
  await adminClient
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
