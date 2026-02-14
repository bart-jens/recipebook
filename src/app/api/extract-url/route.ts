import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRecipeUrl } from "@/lib/recipe-parser";

export async function POST(request: NextRequest) {
  // Verify auth
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const recipe = await parseRecipeUrl(url);
    return NextResponse.json(recipe);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to extract recipe";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
