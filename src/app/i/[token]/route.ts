import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const supabase = createAdminClient();

  const { data: tokenRow } = await supabase
    .from("user_invite_tokens")
    .select("user_id")
    .eq("invite_token", token)
    .single();

  if (!tokenRow) {
    return NextResponse.redirect(new URL("/signup", process.env.NEXT_PUBLIC_APP_URL ?? "https://eefeats.com"));
  }

  const code = generateCode();
  await supabase.from("invites").insert({
    invited_by: tokenRow.user_id,
    code,
  });

  const signupUrl = new URL("/signup", process.env.NEXT_PUBLIC_APP_URL ?? "https://eefeats.com");
  signupUrl.searchParams.set("code", code);
  return NextResponse.redirect(signupUrl, 307);
}
