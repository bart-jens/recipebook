"use server";

import { parseRecipeUrl } from "@/lib/recipe-parser";
import { cleanupRecipeInstructions } from "@/lib/claude-extract-text";

// Instructions that are this long and contain a raw string (not structured
// HowToStep) likely include blog filler and need AI cleanup.
const CLEANUP_THRESHOLD = 500;

export async function fetchRecipeFromUrl(url: string) {
  try {
    new URL(url); // validate URL format
  } catch {
    return { error: "Please enter a valid URL" };
  }

  try {
    const recipe = await parseRecipeUrl(url);

    // Clean up bloated instructions from blog-style recipe sites
    if (recipe.instructions.length > CLEANUP_THRESHOLD) {
      recipe.instructions = await cleanupRecipeInstructions(recipe.instructions);
    }

    return { data: recipe };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not fetch this URL" };
  }
}
