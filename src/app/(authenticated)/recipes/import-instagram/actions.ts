"use server";

import { extractRecipeFromText } from "@/lib/claude-extract-text";
import type { ExtractedRecipe } from "@/lib/claude-extract";

export async function extractFromInstagramUrl(
  url: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  if (!url.trim()) {
    return { error: "Please enter an Instagram URL" };
  }

  // Validate it looks like an Instagram URL
  if (!url.includes("instagram.com/")) {
    return { error: "Please enter a valid Instagram URL" };
  }

  try {
    // Use Instagram oEmbed API to get post caption
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "Instagram post not found. Make sure the post is public." };
      }
      return { error: "Could not fetch Instagram post. Make sure the URL is correct and the post is public." };
    }

    const data = await response.json();
    const caption = data.title;

    if (!caption || caption.trim().length === 0) {
      return { error: "No caption found on this Instagram post" };
    }

    // Use Claude to extract recipe from caption text
    return extractRecipeFromText(caption);
  } catch {
    return { error: "Failed to fetch Instagram post. Check your internet connection and try again." };
  }
}
