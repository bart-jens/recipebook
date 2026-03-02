import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: raw, error } = await supabase.rpc("get_import_status");
  const data = raw as { used: number; limit: number; plan: string } | null;

  if (error || !data) {
    return NextResponse.json({ error: "Failed to fetch import status" }, { status: 500 });
  }

  return NextResponse.json({ used: data.used, limit: data.limit, plan: data.plan });
}
