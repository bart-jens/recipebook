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
      className={`rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        isSaved
          ? "bg-accent/10 text-accent hover:bg-accent/20"
          : "bg-warm-tag text-warm-gray hover:bg-warm-border"
      }`}
    >
      {isPending ? "..." : isSaved ? "Saved" : "Save"}
    </button>
  );
}
