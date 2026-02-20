"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveRecommendation } from "../recipes/[id]/actions";

interface RecommendationCardProps {
  shareId: string;
  title: string;
  sourceUrl: string | null;
  sourceName: string | null;
  sourceType: string;
  imageUrl: string | null;
  tags: string[] | null;
  userRating: number | null;
  shareNotes: string | null;
  sharedAt: string;
  sharerName: string;
  sharerAvatarUrl: string | null;
  sharerId: string;
  recipeId: string;
}

export function RecommendationCard({
  title,
  sourceUrl,
  sourceName,
  sourceType,
  imageUrl,
  tags,
  userRating,
  shareNotes,
  sharedAt,
  sharerName,
  sharerAvatarUrl,
  sharerId,
}: RecommendationCardProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sourceDisplay = sourceName || (sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await saveRecommendation({
      sourceUrl,
      title,
      sourceName,
      sourceType,
      imageUrl,
      tags,
    });

    setSaving(false);

    if (result.error) {
      setSaveError(result.error);
      return;
    }

    if (result.recipeId) {
      setSaved(true);
      router.push(`/recipes/${result.recipeId}`);
    }
  };

  return (
    <div className="overflow-hidden border border-warm-border bg-white">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        {imageUrl ? (
          <div className="h-20 w-20 shrink-0 overflow-hidden bg-warm-tag">
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-accent">
            <span className="font-serif text-2xl text-white/80">
              {title.slice(0, 1)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Sharer info */}
          <div className="mb-1 flex items-center gap-2">
            {sharerAvatarUrl ? (
              <img src={sharerAvatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-serif text-warm-bg">
                {sharerName[0].toUpperCase()}
              </div>
            )}
            <Link href={`/profile/${sharerId}`} className="font-mono text-[11px] text-warm-gray hover:text-accent">
              {sharerName}
            </Link>
            <span className="font-mono text-[11px] text-warm-muted">
              {new Date(sharedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg leading-tight text-ink">{title}</h3>

          {/* Source attribution */}
          {sourceDisplay && (
            <p className="mt-0.5 font-mono text-[11px] text-warm-gray">
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  via {sourceDisplay}
                </a>
              ) : (
                <>from {sourceDisplay}</>
              )}
            </p>
          )}

          {/* Rating */}
          {userRating != null && (
            <div className="mt-1 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-3.5 w-3.5 ${star <= userRating ? "text-accent" : "text-warm-border"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {shareNotes && (
        <div className="border-t border-warm-border px-4 py-3">
          <p className="font-light text-sm text-warm-gray italic">&ldquo;{shareNotes}&rdquo;</p>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="border-t border-warm-border px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="border border-warm-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-warm-gray">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-warm-border px-4 py-2">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save to my recipes"}
        </button>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-wider text-warm-gray hover:text-accent"
          >
            View source
          </a>
        )}
        {saveError && (
          <span className="text-xs text-red-500">{saveError}</span>
        )}
      </div>
    </div>
  );
}
