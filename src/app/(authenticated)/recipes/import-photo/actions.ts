"use server";

import { extractRecipeFromImage } from "@/lib/claude-extract";
import type { ExtractedRecipe } from "@/lib/claude-extract";

export async function extractFromPhoto(
  formData: FormData
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const file = formData.get("image") as File | null;
  if (!file) {
    return { error: "No file uploaded" };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return { error: "Please upload an image file (JPEG, PNG, or WebP)" };
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

  return extractRecipeFromImage(base64, mediaType);
}
