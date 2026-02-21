"use client";

import { useTransition } from "react";
import { saveRecipe, unsaveRecipe } from "../recipes/[id]/actions";
import { useState } from "react";

export function DiscoverSaveButton({
  recipeId,
  isSaved: initialSaved,
}: {
  recipeId: string;
  isSaved: boolean;
}) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          if (isSaved) {
            await unsaveRecipe(recipeId);
            setIsSaved(false);
          } else {
            await saveRecipe(recipeId);
            setIsSaved(true);
          }
        });
      }}
      disabled={isPending}
      className={`transition-all active:scale-[0.9] disabled:opacity-40 ${
        isSaved ? "text-accent" : "text-ink-muted hover:text-accent"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  );
}
