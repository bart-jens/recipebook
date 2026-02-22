import type { ExtractedRecipe } from "./claude-extract";

const CLEANUP_PROMPT = `You are given raw text from a recipe page's JSON-LD data. It contains the actual recipe steps mixed with blog filler (intros, life stories, background info, SEO text, related recipe links, etc.).

Extract ONLY the actual cooking/preparation steps. Return them as clean, numbered steps in the recipe's original language. Do NOT translate. Do NOT add steps that aren't in the original. Do NOT include intro text, background info, tips sections, or "see also" links.

Return ONLY the cleaned instructions text, nothing else. No JSON, no markdown fences, no explanations.

Raw text:
`;

/**
 * Clean up messy recipe instructions using Gemini.
 * Only call this when instructions look like they contain non-recipe content
 * (blog intros, SEO filler, related links, etc.).
 */
export async function cleanupRecipeInstructions(
  rawInstructions: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return rawInstructions; // graceful fallback

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: CLEANUP_PROMPT + rawInstructions }] }],
      }),
    });

    if (!res.ok) return rawInstructions; // fallback on error

    const data = await res.json();
    const cleaned = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return cleaned || rawInstructions;
  } catch {
    return rawInstructions; // never fail the import over cleanup
  }
}

const TEXT_PROMPT = `Extract the recipe from the following text. The text may be from an Instagram post caption or similar social media post. Ignore any non-recipe content (hashtags, personal stories, engagement prompts, emojis used as decoration, "link in bio" text, follower calls-to-action).

Return ONLY valid JSON with this exact structure (no markdown, no code fences, no explanation):

{
  "title": "Recipe title",
  "description": "Brief 1-2 sentence description of the dish",
  "instructions": "Step-by-step instructions, each step on a new line. Do NOT include step numbers, bullets, or dashes at the start of each step — the UI adds numbering automatically",
  "prep_time_minutes": null or number,
  "cook_time_minutes": null or number,
  "servings": null or number,
  "language": "ISO 639-1 code (e.g. en, nl, fr, es, ja, zh, de, it, pt, ko, th, vi, ar)",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "ingredient_name": "name",
      "quantity": null or number (decimal),
      "unit": "unit or empty string",
      "notes": "any notes or empty string"
    }
  ]
}

Important guidelines:
- KEEP THE RECIPE IN ITS ORIGINAL LANGUAGE. Do NOT translate to English. If the recipe is in Dutch, return Dutch text. If it's in French, return French text. Preserve the original language exactly.
- For prep_time_minutes and cook_time_minutes: extract if stated. If not stated, estimate reasonable times based on the recipe steps and ingredients. A simple salad might be 10 min prep / 0 cook; a slow braise might be 15 min prep / 180 min cook.
- For servings: extract if stated, otherwise estimate based on ingredient quantities.
- For tags: include 2-5 lowercase tags covering cuisine (e.g. "italian", "thai"), meal type (e.g. "dinner", "dessert", "snack"), dietary info (e.g. "vegetarian", "gluten-free"), and cooking method (e.g. "baked", "grilled", "one-pot"). Only include tags that clearly apply. You may use hashtags from the original text as hints for tags, but clean them up (lowercase, no # symbol).
- For language: detect the language of the recipe text and return the ISO 639-1 two-letter code. Common codes: en (English), nl (Dutch), fr (French), de (German), es (Spanish), it (Italian), pt (Portuguese), ja (Japanese), zh (Chinese), ko (Korean), th (Thai), vi (Vietnamese), ar (Arabic).

If no recipe is found, return: {"error": "no_recipe"}

Text to extract from:
`;

export async function extractRecipeFromText(
  text: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TEXT_PROMPT + text }] }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Gemini API HTTP error:", res.status, errorBody);
      throw new Error(`Gemini API error ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("Gemini API empty response:", JSON.stringify(data));
      throw new Error("Empty response from Gemini");
    }

    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(responseText);

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found in the pasted text" };
    }

    return { data: parsed as ExtractedRecipe };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("JSON")) {
      return { error: "Could not parse recipe from text. Try pasting more of the caption." };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
