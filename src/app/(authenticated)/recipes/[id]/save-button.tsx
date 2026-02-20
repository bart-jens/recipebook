"use client";

import { useTransition } from "react";
import { saveRecipe, unsaveRecipe } from "./actions";

export function SaveButton({
  recipeId,
  isSaved,
}: {
  recipeId: string;
  isSaved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isSaved) {
        await unsaveRecipe(recipeId);
      } else {
        await saveRecipe(recipeId);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`font-mono text-[10px] uppercase tracking-[0.06em] flex items-center gap-1 transition-all active:scale-[0.94] disabled:opacity-40 ${
        isSaved ? "text-accent" : "text-ink-muted hover:text-ink"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
