import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { untypedRpc } from "@/lib/supabase/rpc";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await untypedRpc<{ used: number; limit: number; plan: string }>(
    supabase,
    "get_import_status"
  );

  if (error || !data) {
    return NextResponse.json({ error: "Failed to fetch import status" }, { status: 500 });
  }

  return NextResponse.json({ used: data.used, limit: data.limit, plan: data.plan });
}
