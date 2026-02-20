"use client";

import { useState } from "react";
import { removeRecommendation, addRecommendation } from "./actions";

export function RecommendedBadge({ recipeId, isRecommended: initial }: { recipeId: string; isRecommended: boolean }) {
  const [isRecommended, setIsRecommended] = useState(initial);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    if (isRecommended) {
      const result = await removeRecommendation(recipeId);
      if (!result?.error) setIsRecommended(false);
    } else {
      const result = await addRecommendation(recipeId);
      if (!result?.error) setIsRecommended(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`font-mono text-[10px] uppercase tracking-[0.06em] flex items-center gap-1 transition-all active:scale-[0.94] disabled:opacity-40 ${
        isRecommended ? "text-accent" : "text-ink-muted hover:text-ink"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill={isRecommended ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
      </svg>
      {isRecommended ? "Recommended" : "Recommend"}
    </button>
  );
}
