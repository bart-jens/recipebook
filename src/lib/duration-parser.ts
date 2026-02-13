/**
 * Parse ISO 8601 duration string into total minutes.
 * Handles formats like "PT30M", "PT1H15M", "PT2H", "P0DT1H30M"
 */
export function parseDuration(iso: string | undefined | null): number | null {
  if (!iso || typeof iso !== "string") return null;

  const match = iso.match(/P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return null;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const total = hours * 60 + minutes;

  return total > 0 ? total : null;
}
