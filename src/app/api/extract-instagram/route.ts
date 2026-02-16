import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipeFromText } from "@/lib/claude-extract-text";
import { getInstagramHandle } from "@/lib/source-name";

interface InstagramData {
  caption: string;
  imageUrl: string | null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
}

async function fetchInstagramData(url: string): Promise<InstagramData> {
  let caption: string | null = null;
  let imageUrl: string | null = null;

  // Try oEmbed first (most reliable when it works)
  try {
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.title && data.title.trim().length > 0) {
        caption = data.title;
      }
      if (data.thumbnail_url) {
        imageUrl = data.thumbnail_url;
      }
    }
  } catch {
    // Fall through to HTML scraping
  }

  // Fallback or supplement: fetch HTML for caption and/or image
  if (!caption || !imageUrl) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      if (!caption) throw new Error(`HTTP ${res.status}`);
    } else {
      const html = await res.text();

      // Extract og:image
      if (!imageUrl) {
        const imgMatch =
          html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/) ||
          html.match(/content="([^"]*)"[^>]*(?:property|name)="og:image"/);
        if (imgMatch?.[1]) {
          imageUrl = decodeHtmlEntities(imgMatch[1]);
        }
      }

      // Extract caption from og:description
      if (!caption) {
        const ogMatch =
          html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/) ||
          html.match(/content="([^"]*)"[^>]*(?:property|name)="og:description"/);
        if (ogMatch?.[1]) {
          caption = decodeHtmlEntities(ogMatch[1]);
        }
      }

      if (!caption) {
        const descMatch =
          html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/) ||
          html.match(/content="([^"]*)"[^>]*(?:property|name)="description"/);
        if (descMatch?.[1]) {
          caption = decodeHtmlEntities(descMatch[1]);
        }
      }
    }
  }

  if (!caption) {
    throw new Error("no_caption");
  }

  return { caption, imageUrl };
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (!url.includes("instagram.com/")) {
    return NextResponse.json(
      { error: "Please enter a valid Instagram URL" },
      { status: 400 }
    );
  }

  try {
    const { caption, imageUrl } = await fetchInstagramData(url);
    const result = await extractRecipeFromText(caption);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const sourceName = getInstagramHandle(url) || "Instagram";
    return NextResponse.json({ ...result.data, imageUrl, source_name: sourceName });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "no_caption") {
      return NextResponse.json(
        {
          error:
            "Could not extract caption from this post. Make sure it's a public post with a recipe in the caption.",
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Could not fetch Instagram post. Make sure the URL is correct and the post is public.",
      },
      { status: 422 }
    );
  }
}
