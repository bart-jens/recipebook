export interface ParsedIngredient {
  quantity: number | null;
  unit: string;
  ingredient_name: string;
  notes: string;
}

const UNITS = [
  // English
  "cups?", "tbsps?", "tablespoons?", "tsps?", "teaspoons?",
  "oz", "ounces?", "lbs?", "pounds?",
  "g", "grams?", "gr", "kg", "kilograms?",
  "ml", "milliliters?", "l", "liters?", "litres?", "dl", "cl",
  "pinch(?:es)?", "dash(?:es)?", "cloves?", "slices?",
  "pieces?", "cans?", "bunche?s?", "sprigs?", "stalks?",
  "heads?", "large", "medium", "small",
  "quarts?", "pints?", "sticks?", "handfuls?", "drops?",
  "packages?", "packets?", "bags?", "boxes?", "jars?",
  "bottles?", "bundles?",
  // Dutch
  "eetlepels?", "el", "theelepels?", "tl",
  "blik(?:ken|je|jes)?", "stuks?", "plakjes?", "sneetjes?",
  "takjes?", "teentjes?", "bosjes?", "bossen",
  "zakjes?", "potjes?", "flesjes?", "blaadjes?",
  // French
  "cuill[èe]res?", "cas", "cac",
  // German
  "EL", "TL", "Stück",
];

const UNIT_PATTERN = new RegExp(`^(${UNITS.join("|")})\\.?\\b\\s*`, "i");

function parseFraction(s: string): number {
  // Handle unicode fractions
  const unicodeFractions: Record<string, number> = {
    "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
    "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
    "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
  };

  let total = 0;
  let remaining = s.trim();

  // Check for unicode fractions
  for (const [char, val] of Object.entries(unicodeFractions)) {
    if (remaining.includes(char)) {
      total += val;
      remaining = remaining.replace(char, "").trim();
    }
  }

  // Check for mixed number: "2 1/2" pattern
  const mixedMatch = remaining.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixedMatch) {
    total += parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
    remaining = remaining.slice(mixedMatch[0].length).trim();
  } else {
    // Check for "X/Y" fraction
    const fractionMatch = remaining.match(/^(\d+)\s*\/\s*(\d+)/);
    if (fractionMatch) {
      total += parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
      remaining = remaining.slice(fractionMatch[0].length).trim();
    } else {
      // Check for whole number
      const wholeMatch = remaining.match(/^(\d+\.?\d*)/);
      if (wholeMatch) {
        total += parseFloat(wholeMatch[1]);
      }
    }
  }

  return total;
}

/**
 * Strip all parenthesized text from a string, handling nested parens.
 * Returns the stripped text and all extracted paren contents as notes.
 */
function extractParenNotes(s: string): { cleaned: string; notes: string } {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let cleaned = "";

  for (const ch of s) {
    if (ch === "(") {
      if (depth === 0 && current) {
        // Starting a new paren group — flush preceding text
      }
      depth++;
      if (depth === 1) {
        current = "";
        continue;
      }
    }
    if (ch === ")") {
      depth--;
      if (depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
      if (depth < 0) depth = 0; // recover from unbalanced parens
    }
    if (depth > 0) {
      current += ch;
    } else {
      cleaned += ch;
    }
  }

  return {
    cleaned: cleaned.replace(/\s+/g, " ").trim(),
    notes: parts.filter(Boolean).join("; "),
  };
}

/**
 * Strip alternate measurement like "/ 1 lb" or "/ 250ml" from ingredient text.
 * Common in sites like RecipeTin Eats: "500g / 1 lb chicken breast"
 */
function stripAlternateMeasurement(s: string): { cleaned: string; note: string } {
  // Require whitespace before "/" to distinguish from fractions like "1/2"
  const altMatch = s.match(/\s+\/\s*[\d.½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+\s*(?:g|kg|ml|l|oz|lbs?|cups?|tbsps?|tsps?|ounces?|pounds?|grams?|kilograms?|liters?|litres?|milliliters?|quarts?|pints?)\b\.?\s*/i);
  if (altMatch) {
    return {
      cleaned: s.replace(altMatch[0], " ").trim(),
      note: altMatch[0].replace(/^\s*\/\s*/, "").trim(),
    };
  }
  return { cleaned: s, note: "" };
}

export function parseIngredient(raw: string): ParsedIngredient {
  let s = raw.trim();

  // Extract notes: text after comma
  let notes = "";
  const commaIdx = s.indexOf(",");
  if (commaIdx > -1) {
    notes = s.slice(commaIdx + 1).trim();
    s = s.slice(0, commaIdx).trim();
  }

  // Extract parenthesized text as notes (handles nested parens)
  const parenResult = extractParenNotes(s);
  if (parenResult.notes) {
    notes = notes ? `${notes}; ${parenResult.notes}` : parenResult.notes;
    s = parenResult.cleaned;
  }

  // Strip alternate measurements (e.g. "/ 1 lb")
  const altResult = stripAlternateMeasurement(s);
  if (altResult.note) {
    notes = notes ? `${notes}; ${altResult.note}` : altResult.note;
    s = altResult.cleaned;
  }

  // Extract quantity
  let quantity: number | null = null;
  const qtyMatch = s.match(/^[\d\s./½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞-]+/);
  if (qtyMatch) {
    const qtyStr = qtyMatch[0].replace(/-/g, " ").trim();
    if (qtyStr) {
      quantity = parseFraction(qtyStr);
      if (quantity === 0) quantity = null;
      s = s.slice(qtyMatch[0].length).trim();
    }
  }

  // Extract unit
  let unit = "";
  const unitMatch = s.match(UNIT_PATTERN);
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase().replace(/\.$/, "");
    s = s.slice(unitMatch[0].length).trim();
  }

  // Remaining is ingredient name — clean up any leftover artifacts
  let ingredient_name = s.replace(/\s+/g, " ").trim();
  // Remove leading/trailing punctuation artifacts from paren/alt stripping
  ingredient_name = ingredient_name.replace(/^[/,;)\s]+|[/,;(\s]+$/g, "").trim();

  return { quantity, unit, ingredient_name: ingredient_name || raw.trim(), notes };
}
