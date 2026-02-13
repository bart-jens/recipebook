import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedRecipe } from "./claude-extract";

const TEXT_PROMPT = `Extract the recipe from the following text. The text is from an Instagram post caption. Ignore any non-recipe content (hashtags, personal stories, engagement prompts, emojis used as decoration).

Return ONLY valid JSON with this exact structure (no markdown, no code fences, no explanation):

{
  "title": "Recipe title",
  "description": "Brief description",
  "instructions": "Step-by-step instructions, each step on a new line",
  "prep_time_minutes": null or number,
  "cook_time_minutes": null or number,
  "servings": null or number,
  "ingredients": [
    {
      "ingredient_name": "name",
      "quantity": null or number (decimal),
      "unit": "unit or empty string",
      "notes": "any notes or empty string"
    }
  ]
}

If no recipe is found, return: {"error": "no_recipe"}

Text to extract from:
`;

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      const isRetryable = message.includes("429") || message.includes("rate") || message.includes("Resource has been exhausted");
      if (isRetryable && i < retries - 1) {
        await new Promise((r) => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function extractRecipeFromText(
  text: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await withRetry(() =>
      model.generateContent(TEXT_PROMPT + text)
    );

    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(responseText);

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found in the pasted text" };
    }

    return { data: parsed as ExtractedRecipe };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Gemini API error:", message);
    if (message.includes("429") || message.includes("rate") || message.includes("Resource has been exhausted")) {
      return { error: "Google API is temporarily busy. Please wait a moment and try again." };
    }
    if (message.includes("JSON")) {
      return { error: "Could not parse recipe from text. Try pasting more of the caption." };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
