"use client";

import { useState } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eefeats.com";

export function ShareLinkButton({ recipeId, title }: { recipeId: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${APP_URL}/r/${recipeId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
      title="Share link"
    >
      {copied ? "Copied!" : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
      )}
    </button>
  );
}
