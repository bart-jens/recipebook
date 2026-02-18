import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const userId = request.nextUrl.searchParams.get("userId");

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid_format" });
  }

  const admin = createAdminClient();

  let query = admin
    .from("user_profiles")
    .select("id")
    .eq("username", username);

  if (userId) {
    query = query.neq("id", userId);
  }

  const { data } = await query.single();

  return NextResponse.json({ available: !data });
}
