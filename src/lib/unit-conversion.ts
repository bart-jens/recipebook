export type UnitSystem = "imperial" | "metric";

interface ConversionResult {
  quantity: number;
  unit: string;
}

const IMPERIAL_TO_METRIC: Record<string, (qty: number) => ConversionResult> = {
  cups: (q) => ({ quantity: round(q * 236.588), unit: "ml" }),
  cup: (q) => ({ quantity: round(q * 236.588), unit: "ml" }),
  tbsp: (q) => ({ quantity: round(q * 14.787), unit: "ml" }),
  tablespoon: (q) => ({ quantity: round(q * 14.787), unit: "ml" }),
  tablespoons: (q) => ({ quantity: round(q * 14.787), unit: "ml" }),
  tsp: (q) => ({ quantity: round(q * 4.929), unit: "ml" }),
  teaspoon: (q) => ({ quantity: round(q * 4.929), unit: "ml" }),
  teaspoons: (q) => ({ quantity: round(q * 4.929), unit: "ml" }),
  oz: (q) => ({ quantity: round(q * 28.35), unit: "g" }),
  ounce: (q) => ({ quantity: round(q * 28.35), unit: "g" }),
  ounces: (q) => ({ quantity: round(q * 28.35), unit: "g" }),
  lb: (q) => ({ quantity: round(q * 453.592), unit: "g" }),
  lbs: (q) => ({ quantity: round(q * 453.592), unit: "g" }),
  pound: (q) => ({ quantity: round(q * 453.592), unit: "g" }),
  pounds: (q) => ({ quantity: round(q * 453.592), unit: "g" }),
};

const METRIC_TO_IMPERIAL: Record<string, (qty: number) => ConversionResult> = {
  ml: (q) => q >= 236 ? ({ quantity: round(q / 236.588), unit: "cups" }) : q >= 15 ? ({ quantity: round(q / 14.787), unit: "tbsp" }) : ({ quantity: round(q / 4.929), unit: "tsp" }),
  milliliters: (q) => METRIC_TO_IMPERIAL.ml(q),
  l: (q) => ({ quantity: round(q * 4.227), unit: "cups" }),
  liters: (q) => METRIC_TO_IMPERIAL.l(q),
  litres: (q) => METRIC_TO_IMPERIAL.l(q),
  g: (q) => q >= 453 ? ({ quantity: round(q / 453.592), unit: "lb" }) : ({ quantity: round(q / 28.35), unit: "oz" }),
  grams: (q) => METRIC_TO_IMPERIAL.g(q),
  kg: (q) => ({ quantity: round(q * 2.205), unit: "lb" }),
  kilograms: (q) => METRIC_TO_IMPERIAL.kg(q),
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function convertIngredient(
  quantity: number | null,
  unit: string,
  targetSystem: UnitSystem
): { quantity: number | null; unit: string } {
  if (!quantity || !unit) return { quantity, unit };

  const unitLower = unit.toLowerCase();
  const conversions = targetSystem === "metric" ? IMPERIAL_TO_METRIC : METRIC_TO_IMPERIAL;
  const converter = conversions[unitLower];

  if (!converter) return { quantity, unit };

  const result = converter(quantity);
  return { quantity: result.quantity, unit: result.unit };
}

export function formatQuantity(qty: number | null): string {
  if (qty === null) return "";
  if (Number.isInteger(qty)) return qty.toString();

  // Common fractions for nicer display
  const fractions: [number, string][] = [
    [0.25, "\u00BC"], [0.5, "\u00BD"], [0.75, "\u00BE"],
    [0.33, "\u2153"], [0.67, "\u2154"],
  ];

  const whole = Math.floor(qty);
  const decimal = qty - whole;

  for (const [val, char] of fractions) {
    if (Math.abs(decimal - val) < 0.05) {
      return whole > 0 ? `${whole}${char}` : char;
    }
  }

  return qty.toString();
}
