import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedRecipe {
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  ingredients: {
    ingredient_name: string;
    quantity: number | null;
    unit: string;
    notes: string;
  }[];
}

const RECIPE_PROMPT = `Extract the recipe from this image. Return ONLY valid JSON with this exact structure (no markdown, no code fences, no explanation):

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

If no recipe is found in the image, return: {"error": "no_recipe"}`;

export async function extractRecipeFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent([
      RECIPE_PROMPT,
      {
        inlineData: {
          mimeType: mediaType,
          data: base64Image,
        },
      },
    ]);

    let text = result.response.text();

    // Strip markdown code fences if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(text);

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found in this image" };
    }

    return { data: parsed as ExtractedRecipe };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Gemini API error:", message);
    if (message.includes("JSON")) {
      return { error: "Could not parse recipe from image. Try a clearer photo." };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
