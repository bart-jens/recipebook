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
      className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink flex items-center gap-1 transition-all active:scale-[0.94]"
      title="Share link"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
      {copied ? "Copied" : "Share"}
    </button>
  );
}
