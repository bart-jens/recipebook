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

  const { data, error } = await (supabase as any).rpc("get_import_status") as {
    data: { used: number; limit: number; plan: string } | null;
    error: unknown;
  };

  if (error || !data) {
    return NextResponse.json({ error: "Failed to fetch import status" }, { status: 500 });
  }

  return NextResponse.json({ used: data.used, limit: data.limit, plan: data.plan });
}
