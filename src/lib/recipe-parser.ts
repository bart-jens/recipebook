import * as cheerio from "cheerio";
import { parseIngredient, type ParsedIngredient } from "./ingredient-parser";
import { parseDuration } from "./duration-parser";
import { getSourceNameFromUrl } from "./source-name";
import {
  extractRecipeFromHtml,
  stripHtmlForExtraction,
} from "./claude-extract-html";

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

async function fetchRecipeHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,nl;q=0.9,*;q=0.5",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "This website blocked our request. Try importing a photo of the recipe instead."
        );
      }
      if (response.status === 404) {
        throw new Error("Page not found. Check the URL and try again.");
      }
      if (response.status >= 500) {
        throw new Error("This website is having issues. Try again later.");
      }
      throw new Error(`Could not fetch this URL (status ${response.status})`);
    }

    return await response.text();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "This website took too long to respond. Try again later."
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

function tryJsonLd($: cheerio.CheerioAPI): SchemaRecipe | null {
  let recipe: SchemaRecipe | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return;
    const raw = $(el).html() || "";
    try {
      const data = JSON.parse(raw);
      recipe = findRecipeInGraph(data);
    } catch {
      try {
        const data = JSON.parse(sanitizeJsonLd(raw));
        recipe = findRecipeInGraph(data);
      } catch {
        // truly invalid JSON, skip
      }
    }
  });
  return recipe;
}

function schemaToRecipe(
  r: SchemaRecipe,
  $: cheerio.CheerioAPI,
  url: string
): ParsedRecipe {
  const ingredients = (r.recipeIngredient || []).map((s) =>
    parseIngredient(decodeHtmlEntities(s))
  );
  const tags = parseTags(r);
  const htmlLang = $("html").attr("lang");
  const language = htmlLang
    ? htmlLang.split("-")[0].toLowerCase().slice(0, 2)
    : null;

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

function tryHtmlScrape(
  $: cheerio.CheerioAPI,
  url: string
): ParsedRecipe | null {
  const title =
    $('[itemprop="name"]').first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  const ingredients: string[] = [];
  $('[itemprop="recipeIngredient"], [itemprop="ingredients"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(text);
  });

  if (ingredients.length === 0) {
    $(
      ".wprm-recipe-ingredient, .tasty-recipe-ingredients li, .easyrecipe .ingredient, .recipe-card-ingredients li"
    ).each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(text);
    });
  }

  const steps: string[] = [];
  $('[itemprop="recipeInstructions"]').each((_, el) => {
    const nested = $(el).find('[itemprop="step"], [itemprop="text"], li');
    if (nested.length > 0) {
      nested.each((__, step) => {
        const text = $(step).text().trim();
        if (text) steps.push(text);
      });
    } else {
      const text = $(el).text().trim();
      if (text) steps.push(text);
    }
  });

  if (steps.length === 0) {
    $(
      ".wprm-recipe-instruction, .tasty-recipe-instructions li, .easyrecipe .instruction, .recipe-card-instructions li"
    ).each((_, el) => {
      const text = $(el).text().trim();
      if (text) steps.push(text);
    });
  }

  const instructions = steps.join("\n");

  if (!title || (ingredients.length === 0 && !instructions)) {
    return null;
  }

  const description =
    $('[itemprop="description"]').first().text().trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  const imageUrl =
    $('[itemprop="image"]').attr("src") ||
    $('[itemprop="image"] img').attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    null;

  const prepTime = parseDuration(
    $('[itemprop="prepTime"]').attr("content") ||
      $('[itemprop="prepTime"]').attr("datetime") ||
      null
  );
  const cookTime = parseDuration(
    $('[itemprop="cookTime"]').attr("content") ||
      $('[itemprop="cookTime"]').attr("datetime") ||
      null
  );
  const servings = parseServings(
    $('[itemprop="recipeYield"]').first().text().trim() || null
  );

  const htmlLang = $("html").attr("lang");
  const language = htmlLang
    ? htmlLang.split("-")[0].toLowerCase().slice(0, 2)
    : null;

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    instructions: decodeHtmlEntities(instructions),
    prep_time_minutes: prepTime,
    cook_time_minutes: cookTime,
    servings,
    language,
    tags: [],
    ingredients: ingredients.map((s) =>
      parseIngredient(decodeHtmlEntities(s))
    ),
    source_url: url,
    source_name: getSourceNameFromUrl(url),
    imageUrl,
  };
}

export async function parseRecipeUrl(url: string): Promise<ParsedRecipe> {
  const html = await fetchRecipeHtml(url);
  const $ = cheerio.load(html);

  // Tier 1: JSON-LD structured data
  const jsonLdRecipe = tryJsonLd($);
  if (jsonLdRecipe) {
    return schemaToRecipe(jsonLdRecipe, $, url);
  }

  // Tier 2: HTML microdata / common recipe plugin scraping
  const scrapedRecipe = tryHtmlScrape($, url);
  if (scrapedRecipe) {
    return scrapedRecipe;
  }

  // Tier 3: AI extraction via Gemini
  const strippedText = stripHtmlForExtraction($);
  const aiResult = await extractRecipeFromHtml(strippedText);
  if (aiResult.data) {
    const d = aiResult.data;
    const htmlLang = $("html").attr("lang");
    const language =
      d.language ||
      (htmlLang ? htmlLang.split("-")[0].toLowerCase().slice(0, 2) : null);

    return {
      title: d.title || "Untitled Recipe",
      description: d.description || "",
      instructions: d.instructions || "",
      prep_time_minutes: d.prep_time_minutes,
      cook_time_minutes: d.cook_time_minutes,
      servings: d.servings,
      language,
      tags: d.tags || [],
      ingredients: d.ingredients || [],
      source_url: url,
      source_name: getSourceNameFromUrl(url),
      imageUrl:
        parseImage(
          $('meta[property="og:image"]').attr("content") || null
        ) || null,
    };
  }

  throw new Error(
    "Could not extract a recipe from this page. Try importing a photo of the recipe instead."
  );
}
