"use server";

import { extractRecipeFromImage } from "@/lib/claude-extract";
import type { ExtractedRecipe } from "@/lib/claude-extract";

export async function extractFromPhotoBase64(
  base64: string,
  mediaType: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  if (!base64) {
    return { error: "No image provided" };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(mediaType)) {
    return { error: "Please upload an image file (JPEG, PNG, or WebP)" };
  }

  return extractRecipeFromImage(
    base64,
    mediaType as "image/jpeg" | "image/png" | "image/webp"
  );
}
