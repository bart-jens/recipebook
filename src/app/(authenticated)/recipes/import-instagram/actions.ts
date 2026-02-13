"use server";

import { extractRecipeFromImage } from "@/lib/claude-extract";
import { extractRecipeFromText } from "@/lib/claude-extract-text";
import type { ExtractedRecipe } from "@/lib/claude-extract";

export async function extractFromCaption(
  text: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  if (!text.trim()) {
    return { error: "Please paste some text" };
  }
  return extractRecipeFromText(text);
}

export async function extractFromImage(
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
