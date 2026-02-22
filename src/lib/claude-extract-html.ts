import * as cheerio from "cheerio";
import type { ExtractedRecipe } from "./claude-extract";

const HTML_PROMPT = `Extract the recipe from the following webpage text content. The content has been stripped of navigation, scripts, and styling — focus on finding the recipe title, ingredients, and instructions.

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
- For prep_time_minutes and cook_time_minutes: extract if stated. If not stated, estimate reasonable times based on the recipe steps and ingredients.
- For servings: extract if stated, otherwise estimate based on ingredient quantities.
- For tags: include 2-5 lowercase tags covering cuisine, meal type, dietary info, and cooking method. Only include tags that clearly apply.
- For language: detect the language of the recipe text and return the ISO 639-1 two-letter code.
- Ignore ads, SEO content, life stories, cookie notices, and navigation text. Extract ONLY the recipe.

If no recipe is found, return: {"error": "no_recipe"}

Webpage content:
`;

/**
 * Strip non-content HTML tags and return text suitable for AI extraction.
 */
export function stripHtmlForExtraction($: cheerio.CheerioAPI): string {
  $(
    "script, style, nav, footer, header, aside, iframe, noscript, svg"
  ).remove();
  $("*")
    .contents()
    .filter(function () {
      return this.type === "comment";
    })
    .remove();

  let text = "";
  const mainContent =
    $("article").first().text() ||
    $("main").first().text() ||
    $('[role="main"]').first().text();

  if (mainContent && mainContent.trim().length > 200) {
    text = mainContent.trim();
  } else {
    text = $("body").text() || $.text();
  }

  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();

  if (text.length > 50_000) {
    text = text.slice(0, 50_000);
  }

  return text;
}

export async function extractRecipeFromHtml(
  text: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  if (text.trim().length < 100) {
    return { error: "Not enough content to extract a recipe" };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: HTML_PROMPT + text }] }],
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

    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(responseText);

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found on this page" };
    }

    return { data: parsed as ExtractedRecipe };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("JSON")) {
      return { error: "Could not parse recipe from this page" };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
