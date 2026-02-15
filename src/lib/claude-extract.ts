export interface ExtractedRecipe {
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  tags: string[];
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
  "description": "Brief 1-2 sentence description of the dish",
  "instructions": "Step-by-step instructions, each step on a new line",
  "prep_time_minutes": null or number,
  "cook_time_minutes": null or number,
  "servings": null or number,
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
- For prep_time_minutes and cook_time_minutes: extract if stated. If not stated, estimate reasonable times based on the recipe steps and ingredients. A simple salad might be 10 min prep / 0 cook; a slow braise might be 15 min prep / 180 min cook.
- For servings: extract if stated, otherwise estimate based on ingredient quantities.
- For tags: include 2-5 lowercase tags covering cuisine (e.g. "italian", "thai"), meal type (e.g. "dinner", "dessert", "snack"), dietary info (e.g. "vegetarian", "gluten-free"), and cooking method (e.g. "baked", "grilled", "one-pot"). Only include tags that clearly apply.

If no recipe is found in the image, return: {"error": "no_recipe"}`;

async function callGemini(
  apiKey: string,
  parts: unknown[]
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Gemini API HTTP error:", res.status, errorBody);
    throw new Error(`Gemini API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("Gemini API empty response:", JSON.stringify(data));
    throw new Error("Empty response from Gemini");
  }

  return text;
}

export async function extractRecipeFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  try {
    let text = await callGemini(apiKey, [
      { text: RECIPE_PROMPT },
      { inline_data: { mime_type: mediaType, data: base64Image } },
    ]);

    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(text);

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found in this image" };
    }

    return { data: parsed as ExtractedRecipe };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("JSON")) {
      return { error: "Could not parse recipe from image. Try a clearer photo." };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
