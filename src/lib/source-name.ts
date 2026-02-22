const DOMAIN_MAP: Record<string, string> = {
  "seriouseats.com": "Serious Eats",
  "bonappetit.com": "Bon Appetit",
  "nytimes.com": "NYT Cooking",
  "cooking.nytimes.com": "NYT Cooking",
  "allrecipes.com": "Allrecipes",
  "foodnetwork.com": "Food Network",
  "epicurious.com": "Epicurious",
  "food52.com": "Food52",
  "smittenkitchen.com": "Smitten Kitchen",
  "budgetbytes.com": "Budget Bytes",
  "minimalistbaker.com": "Minimalist Baker",
  "halfbakedharvest.com": "Half Baked Harvest",
  "cookieandkate.com": "Cookie and Kate",
  "thekitchn.com": "The Kitchn",
  "tasty.co": "Tasty",
  "delish.com": "Delish",
  "simplyrecipes.com": "Simply Recipes",
  "kingarthurbaking.com": "King Arthur Baking",
  "bbcgoodfood.com": "BBC Good Food",
  "recipetineats.com": "RecipeTin Eats",
  "skinnytaste.com": "Skinnytaste",
  "damndelicious.net": "Damn Delicious",
  "pinchofyum.com": "Pinch of Yum",
  "loveandlemons.com": "Love and Lemons",
  "sallysbakingaddiction.com": "Sally's Baking Addiction",
  "cafedelites.com": "Cafe Delites",
  "hostthetoast.com": "Host the Toast",
  "thepioneerwoman.com": "The Pioneer Woman",
  "marthastewart.com": "Martha Stewart",
  "jamieoliver.com": "Jamie Oliver",
  "nigella.com": "Nigella Lawson",
  "ottolenghi.co.uk": "Ottolenghi",
  "joshuaweissman.com": "Joshua Weissman",
  "rainbowplantlife.com": "Rainbow Plant Life",
  "indianhealthyrecipes.com": "Indian Healthy Recipes",
  "chefsteps.com": "ChefSteps",
  "kenji.com": "J. Kenji Lopez-Alt",
  "instagram.com": "Instagram",
  // Dutch
  "ah.nl": "Albert Heijn Allerhande",
  "leukerecepten.nl": "Leuke Recepten",
  "24kitchen.nl": "24Kitchen",
  "smulweb.nl": "Smulweb",
  "jumbo.com": "Jumbo",
  "laurasbakery.nl": "Laura's Bakery",
  "ohmyfoodness.nl": "OhMyFoodness",
  "francescakookt.nl": "Francesca Kookt",
  "rutgerbakt.nl": "Rutger Bakt",
  "culy.nl": "Culy",
};

/**
 * Extract a human-readable source name from a URL domain.
 * Uses a curated mapping for known recipe sites, falls back to raw domain.
 */
export function getSourceNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    // Check exact match first
    if (DOMAIN_MAP[hostname]) return DOMAIN_MAP[hostname];

    // Check if domain ends with a known key (handles subdomains)
    for (const [domain, name] of Object.entries(DOMAIN_MAP)) {
      if (hostname.endsWith(`.${domain}`) || hostname === domain) {
        return name;
      }
    }

    // Fallback: return raw domain
    return hostname;
  } catch {
    return url;
  }
}

/**
 * Extract Instagram handle from URL if possible.
 */
export function getInstagramHandle(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p\/[^/]+\/?\?.*?|reel\/[^/]+\/?\?.*?|stories\/)?([^/?]+)/);
  if (match?.[1] && !["p", "reel", "stories", "explore"].includes(match[1])) {
    return match[1];
  }
  return null;
}
