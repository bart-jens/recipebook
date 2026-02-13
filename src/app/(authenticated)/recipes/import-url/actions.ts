"use server";

import { parseRecipeUrl } from "@/lib/recipe-parser";

export async function fetchRecipeFromUrl(url: string) {
  try {
    new URL(url); // validate URL format
  } catch {
    return { error: "Please enter a valid URL" };
  }

  try {
    const recipe = await parseRecipeUrl(url);
    return { data: recipe };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not fetch this URL" };
  }
}
