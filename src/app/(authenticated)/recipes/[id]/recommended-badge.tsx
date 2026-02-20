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

  if (isRecommended) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray">
        Recommended
        <button onClick={handleToggle} disabled={loading} className="text-xs text-warm-gray/60 hover:text-warm-gray underline">
          Remove
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
    >
      Recommend
    </button>
  );
}
