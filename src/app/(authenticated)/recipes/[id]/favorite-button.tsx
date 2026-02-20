"use client";

import { useTransition } from "react";
import { toggleFavorite } from "./actions";

export function FavoriteButton({
  recipeId,
  isFavorited,
  hasCooked,
}: {
  recipeId: string;
  isFavorited: boolean;
  hasCooked: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleFavorite(recipeId, !isFavorited);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || !hasCooked}
      className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted hover:text-ink flex items-center gap-1 transition-all active:scale-[0.94] disabled:opacity-40"
      title={!hasCooked ? "Cook this recipe to add it to favorites" : isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`h-3.5 w-3.5 ${isFavorited ? "text-accent" : ""}`}
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFavorited ? 0 : 1.5}
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
