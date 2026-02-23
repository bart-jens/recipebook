"use client";

import { useState } from "react";
import { publishRecipe } from "./[id]/actions";

export function PublishInline({
  recipeId,
  sourceType,
}: {
  recipeId: string;
  sourceType: string;
}) {
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const canPublish = sourceType === "manual" || sourceType === "fork";

  if (published) {
    return (
      <span className="text-[10px] font-normal tracking-[0.02em] text-olive flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        Published
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted/60 shrink-0" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span className="text-[10px] font-normal tracking-[0.02em] text-ink-muted/60">Private</span>
      {canPublish && (
        <>
          <span className="text-ink-muted/40 text-[10px]">·</span>
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setLoading(true);
              const result = await publishRecipe(recipeId);
              if (!result?.error) setPublished(true);
              setLoading(false);
            }}
            disabled={loading}
            aria-label="Publish this recipe"
            className="text-[10px] font-normal tracking-[0.02em] text-accent hover:underline disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Publish"}
          </button>
        </>
      )}
    </span>
  );
}
