import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_LIMIT = 10;

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("plan, monthly_imports_used, imports_reset_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to fetch import status" }, { status: 500 });
  }

  // Determine if this is a new month and counter would reset
  const isNewMonth =
    !data.imports_reset_at ||
    new Date(data.imports_reset_at).getMonth() !== new Date().getMonth() ||
    new Date(data.imports_reset_at).getFullYear() !== new Date().getFullYear();

  const used = isNewMonth ? 0 : (data.monthly_imports_used ?? 0);
  const limit = data.plan === "premium" ? 0 : FREE_LIMIT;

  return NextResponse.json({ used, limit, plan: data.plan });
}
