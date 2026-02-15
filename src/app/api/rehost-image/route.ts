import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rehostImage } from "@/lib/rehost-image";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl, recipeId } = await request.json();
  if (!imageUrl || !recipeId) {
    return NextResponse.json(
      { error: "imageUrl and recipeId are required" },
      { status: 400 }
    );
  }

  try {
    const rehostedUrl = await rehostImage(imageUrl, user.id, recipeId);

    // Update the recipe with the rehosted URL
    await supabase
      .from("recipes")
      .update({ image_url: rehostedUrl })
      .eq("id", recipeId)
      .eq("created_by", user.id);

    return NextResponse.json({ image_url: rehostedUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to rehost image";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
