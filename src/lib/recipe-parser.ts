import * as cheerio from "cheerio";
import { parseIngredient, type ParsedIngredient } from "./ingredient-parser";
import { parseDuration } from "./duration-parser";
import { getSourceNameFromUrl } from "./source-name";

export interface ParsedRecipe {
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  tags: string[];
  ingredients: ParsedIngredient[];
  source_url: string;
  source_name: string;
  imageUrl: string | null;
}

interface SchemaRecipe {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  image?: unknown;
  recipeInstructions?: unknown;
  recipeIngredient?: string[];
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string | string[] | number;
  [key: string]: unknown;
}

function findRecipeInGraph(data: unknown): SchemaRecipe | null {
  if (!data || typeof data !== "object") return null;

  // Direct recipe object
  if (isRecipeType(data as SchemaRecipe)) return data as SchemaRecipe;

  // @graph array
  if ("@graph" in (data as Record<string, unknown>)) {
    const graph = (data as Record<string, unknown>)["@graph"];
    if (Array.isArray(graph)) {
      for (const item of graph) {
        if (isRecipeType(item)) return item as SchemaRecipe;
      }
    }
  }

  // Array of items
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInGraph(item);
      if (found) return found;
    }
  }

  return null;
}

function isRecipeType(obj: SchemaRecipe): boolean {
  const type = obj["@type"];
  if (typeof type === "string") return type === "Recipe";
  if (Array.isArray(type)) return type.includes("Recipe");
  return false;
}

function parseInstructions(raw: unknown): string {
  if (typeof raw === "string") return raw;

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) return item.text;
        if (item && typeof item === "object" && "itemListElement" in item) {
          // HowToSection with nested steps
          const elements = (item as { itemListElement: unknown[] }).itemListElement;
          return Array.isArray(elements)
            ? elements.map((el) => (typeof el === "string" ? el : (el as { text?: string }).text || "")).join("\n")
            : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function parseImage(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    // Array of strings or ImageObjects
    for (const item of raw) {
      const url = parseImage(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof raw === "object" && raw !== null) {
    // ImageObject with url property
    const obj = raw as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
  }
  return null;
}

function parseServings(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const match = raw.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return parseServings(raw[0]);
  }
  return null;
}

function parseTags(r: SchemaRecipe): string[] {
  const tagSet = new Set<string>();

  const addTags = (raw: unknown) => {
    if (typeof raw === "string") {
      // Could be comma-separated: "Italian, Pasta, Dinner"
      raw.split(/[,;]/).forEach((t) => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned && cleaned.length <= 30) tagSet.add(cleaned);
      });
    }
    if (Array.isArray(raw)) {
      raw.forEach((item) => addTags(item));
    }
  };

  addTags(r.recipeCategory);
  addTags(r.recipeCuisine);
  addTags(r.keywords);

  return Array.from(tagSet).slice(0, 10);
}

export async function parseRecipeUrl(url: string): Promise<ParsedRecipe> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RecipeBook/1.0)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch this URL (status ${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Find all JSON-LD scripts
  let recipe: SchemaRecipe | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return; // already found
    try {
      const data = JSON.parse($(el).html() || "");
      recipe = findRecipeInGraph(data);
    } catch {
      // invalid JSON, skip
    }
  });

  if (!recipe) {
    throw new Error("No recipe found at this URL");
  }

  const r: SchemaRecipe = recipe;
  const ingredients = (r.recipeIngredient || []).map((s) => parseIngredient(s));

  // Extract tags from recipeCategory, recipeCuisine, and keywords
  const tags = parseTags(r);

  return {
    title: r.name || "Untitled Recipe",
    description: r.description || "",
    instructions: parseInstructions(r.recipeInstructions),
    prep_time_minutes: parseDuration(r.prepTime),
    cook_time_minutes: parseDuration(r.cookTime),
    servings: parseServings(r.recipeYield),
    tags,
    ingredients,
    source_url: url,
    source_name: getSourceNameFromUrl(url),
    imageUrl: parseImage(r.image),
  };
}
