"use client";

import { useState } from "react";
import { publishRecipe } from "./actions";

export function PublishBanner({
  recipeId,
  initialVisibility,
  sourceType,
  sourceUrl,
  sourceName,
}: {
  recipeId: string;
  initialVisibility: string;
  sourceType: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const canPublish = sourceType === "manual" || sourceType === "fork";

  // Already public — nothing to show
  if (initialVisibility === "public" && !justPublished) return null;

  if (justPublished) {
    return (
      <div className="mx-5 mt-4 px-4 py-3 bg-olive/10 border border-olive/30 flex items-center gap-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-olive shrink-0" aria-hidden="true">
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div className="min-w-0">
            <p className="text-[12px] font-light text-ink-secondary leading-snug">
              Your followers can&apos;t see when you cook this.{" "}
              <span className="text-ink-muted">Publish it to share with them.</span>
            </p>
            {publishError && (
              <p className="text-[11px] text-accent mt-1">{publishError}</p>
            )}
          </div>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            setPublishError(null);
            const result = await publishRecipe(recipeId);
            if (!result?.error) {
              setJustPublished(true);
            } else {
              setPublishError("Could not publish. Try again.");
            }
            setLoading(false);
          }}
          disabled={loading}
          aria-label="Publish this recipe"
          className="shrink-0 text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-3 py-1.5 hover:bg-ink/80 transition-colors active:scale-[0.96] disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    );
  }

  // Imported recipe — explain personal cookbook concept
  const sourceLabel = sourceName || (sourceUrl ? (() => { try { return new URL(sourceUrl).hostname.replace(/^www\./, ''); } catch { return null; } })() : null);

  return (
    <div className="mx-5 mt-4 px-4 py-3 bg-surface border border-border">
      <p className="text-[12px] font-light text-ink-secondary leading-snug">
        From your personal cookbook.{' '}
        {sourceLabel && sourceUrl ? (
          <>
            Saved from{' '}
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {sourceLabel}
            </a>
            .{' '}
          </>
        ) : sourceLabel ? (
          <>Saved from {sourceLabel}. </>
        ) : (
          <>Saved from a cookbook. </>
        )}
        Your followers will see when you cook it.
      </p>
    </div>
  );
}
