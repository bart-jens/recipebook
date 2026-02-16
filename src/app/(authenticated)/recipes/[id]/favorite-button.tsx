"use client";

import { useTransition } from "react";
import { toggleFavorite } from "./actions";

export function FavoriteButton({
  recipeId,
  isFavorite,
}: {
  recipeId: string;
  isFavorite: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleFavorite(recipeId, !isFavorite);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md bg-warm-tag p-1.5 text-warm-gray hover:bg-warm-border disabled:opacity-50"
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`h-5 w-5 ${isFavorite ? "text-red-400" : "text-warm-border"}`}
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFavorite ? 0 : 1.5}
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
