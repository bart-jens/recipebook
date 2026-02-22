"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "./actions";

export function FavoriteButton({
  recipeId,
  isFavorited,
}: {
  recipeId: string;
  isFavorited: boolean;
}) {
  const [optimistic, setOptimistic] = useState(isFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      const result = await toggleFavorite(recipeId, next);
      if (result?.error) {
        setOptimistic(!next);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink flex items-center gap-1 transition-all active:scale-[0.94] disabled:opacity-40"
      title={optimistic ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`h-3.5 w-3.5 transition-colors ${optimistic ? "text-accent" : ""}`}
        fill={optimistic ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={optimistic ? 0 : 1.5}
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
