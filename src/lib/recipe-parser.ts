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
  language: string | null;
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

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&deg;/g, "\u00B0")
    .replace(/&frac12;/g, "\u00BD")
    .replace(/&frac14;/g, "\u00BC")
    .replace(/&frac34;/g, "\u00BE")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Sanitize JSON-LD: escape literal control characters inside string values.
 * Many recipe sites (especially WordPress) emit invalid JSON with raw newlines
 * in string values instead of escaped \n sequences. This tracks whether we're
 * inside a JSON string and only escapes control characters there, leaving
 * structural whitespace untouched.
 */
function sanitizeJsonLd(raw: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];

    if (escaped) {
      result += c;
      escaped = false;
      continue;
    }

    if (c === "\\" && inString) {
      result += c;
      escaped = true;
      continue;
    }

    if (c === '"') {
      inString = !inString;
      result += c;
      continue;
    }

    if (inString) {
      if (c === "\n") { result += "\\n"; continue; }
      if (c === "\r") { result += "\\r"; continue; }
      if (c === "\t") { result += "\\t"; continue; }
      const code = c.charCodeAt(0);
      if (code < 0x20) continue; // strip other control chars
    }

    result += c;
  }

  return result;
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
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
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
    const raw = $(el).html() || "";
    try {
      const data = JSON.parse(raw);
      recipe = findRecipeInGraph(data);
    } catch {
      // Many recipe sites emit invalid JSON-LD with literal control
      // characters in string values. Try sanitizing before giving up.
      try {
        const data = JSON.parse(sanitizeJsonLd(raw));
        recipe = findRecipeInGraph(data);
      } catch {
        // truly invalid JSON, skip
      }
    }
  });

  if (!recipe) {
    throw new Error("No recipe found at this URL");
  }

  const r: SchemaRecipe = recipe;
  const ingredients = (r.recipeIngredient || []).map((s) => parseIngredient(decodeHtmlEntities(s)));

  // Extract tags from recipeCategory, recipeCuisine, and keywords
  const tags = parseTags(r);

  // Detect language from <html lang> attribute
  const htmlLang = $("html").attr("lang");
  const language = htmlLang ? htmlLang.split("-")[0].toLowerCase().slice(0, 2) : null;

  return {
    title: decodeHtmlEntities(r.name || "Untitled Recipe"),
    description: decodeHtmlEntities(r.description || ""),
    instructions: decodeHtmlEntities(parseInstructions(r.recipeInstructions)),
    prep_time_minutes: parseDuration(r.prepTime),
    cook_time_minutes: parseDuration(r.cookTime),
    servings: parseServings(r.recipeYield),
    language,
    tags,
    ingredients,
    source_url: url,
    source_name: getSourceNameFromUrl(url),
    imageUrl: parseImage(r.image),
  };
}
