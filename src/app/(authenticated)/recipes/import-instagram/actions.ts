"use server";

import { extractRecipeFromText } from "@/lib/claude-extract-text";
import type { ExtractedRecipe } from "@/lib/claude-extract";

async function fetchInstagramCaption(url: string): Promise<string> {
  // Try oEmbed first (most reliable when it works)
  try {
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.title && data.title.trim().length > 0) {
        return data.title;
      }
    }
  } catch {
    // Fall through to HTML scraping
  }

  // Fallback: fetch HTML and extract og:description
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept": "text/html",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const html = await res.text();

  // Try og:description meta tag (Instagram includes caption here)
  const ogMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
    || html.match(/content="([^"]*)"[^>]*(?:property|name)="og:description"/);
  if (ogMatch?.[1]) {
    // Decode HTML entities
    return ogMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'");
  }

  // Try description meta tag
  const descMatch = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/)
    || html.match(/content="([^"]*)"[^>]*(?:property|name)="description"/);
  if (descMatch?.[1]) {
    return descMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'");
  }

  throw new Error("no_caption");
}

export async function extractFromInstagramUrl(
  url: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  if (!url.trim()) {
    return { error: "Please enter an Instagram URL" };
  }

  if (!url.includes("instagram.com/")) {
    return { error: "Please enter a valid Instagram URL" };
  }

  try {
    const caption = await fetchInstagramCaption(url);
    return extractRecipeFromText(caption);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "no_caption") {
      return { error: "Could not extract caption from this post. Make sure it's a public post with a recipe in the caption." };
    }
    return { error: "Could not fetch Instagram post. Make sure the URL is correct and the post is public." };
  }
}
