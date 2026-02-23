"use client";

import { useState } from "react";
import { publishRecipe } from "./actions";

export function PublishBanner({
  recipeId,
  initialVisibility,
  sourceType,
}: {
  recipeId: string;
  initialVisibility: string;
  sourceType: string;
}) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [loading, setLoading] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  const canPublish = sourceType === "manual" || sourceType === "fork";

  // Already public — nothing to show
  if (visibility === "public") return null;

  if (justPublished) {
    return (
      <div className="mx-5 mt-4 px-4 py-3 bg-olive/10 border border-olive/30 flex items-center gap-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-olive shrink-0">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <p className="text-[12px] font-normal text-olive">
          Published — your followers can now see this recipe in their feed.
        </p>
      </div>
    );
  }

  if (canPublish) {
    return (
      <div className="mx-5 mt-4 px-4 py-3 bg-surface border border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p className="text-[12px] font-light text-ink-secondary leading-snug">
            Your followers can&apos;t see when you cook this.{" "}
            <span className="text-ink-muted">Publish it to share with them.</span>
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            const result = await publishRecipe(recipeId);
            if (!result?.error) {
              setVisibility("public");
              setJustPublished(true);
            }
            setLoading(false);
          }}
          disabled={loading}
          className="shrink-0 text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-3 py-1.5 hover:bg-ink/80 transition-colors active:scale-[0.96] disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    );
  }

  // Imported recipe — informational only
  return (
    <div className="mx-5 mt-4 px-4 py-3 bg-surface border border-border flex items-center gap-2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <p className="text-[12px] font-light text-ink-secondary">
        Saved to your private collection. Only you can see this.
      </p>
    </div>
  );
}
