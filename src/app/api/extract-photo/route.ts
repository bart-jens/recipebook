import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipeFromImage } from "@/lib/claude-extract";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { base64, mediaType } = await request.json();
  if (!base64) {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 }
    );
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(mediaType)) {
    return NextResponse.json(
      { error: "Please upload an image file (JPEG, PNG, or WebP)" },
      { status: 400 }
    );
  }

  const result = await extractRecipeFromImage(
    base64,
    mediaType as "image/jpeg" | "image/png" | "image/webp"
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(result.data);
}
