export interface ParsedIngredient {
  quantity: number | null;
  unit: string;
  ingredient_name: string;
  notes: string;
}

const UNITS = [
  "cups?", "tbsps?", "tablespoons?", "tsps?", "teaspoons?",
  "oz", "ounces?", "lbs?", "pounds?",
  "g", "grams?", "kg", "kilograms?",
  "ml", "milliliters?", "l", "liters?", "litres?",
  "pinch(?:es)?", "dash(?:es)?", "cloves?", "slices?",
  "pieces?", "cans?", "bunche?s?", "sprigs?", "stalks?",
  "heads?", "large", "medium", "small",
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

  // Check for "X/Y" fraction
  const fractionMatch = remaining.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fractionMatch) {
    total += parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    remaining = remaining.slice(fractionMatch[0].length).trim();
  }

  // Check for whole number
  const wholeMatch = remaining.match(/^(\d+\.?\d*)/);
  if (wholeMatch) {
    total += parseFloat(wholeMatch[1]);
  }

  return total;
}

export function parseIngredient(raw: string): ParsedIngredient {
  let s = raw.trim();

  // Extract notes: text after comma or in parentheses
  let notes = "";
  const commaIdx = s.indexOf(",");
  if (commaIdx > -1) {
    notes = s.slice(commaIdx + 1).trim();
    s = s.slice(0, commaIdx).trim();
  }
  const parenMatch = s.match(/\(([^)]+)\)/);
  if (parenMatch) {
    notes = notes ? `${notes}; ${parenMatch[1]}` : parenMatch[1];
    s = s.replace(/\s*\([^)]+\)\s*/, " ").trim();
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

  // Remaining is ingredient name
  const ingredient_name = s.replace(/\s+/g, " ").trim();

  return { quantity, unit, ingredient_name: ingredient_name || raw.trim(), notes };
}
