"use client";

import { useTransition } from "react";
import { publishRecipe, unpublishRecipe } from "./actions";

export function PublishButton({
  recipeId,
  isPublic,
}: {
  recipeId: string;
  isPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isPublic) {
        await unpublishRecipe(recipeId);
      } else {
        await publishRecipe(recipeId);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
        isPublic
          ? "border border-warm-border text-warm-gray hover:bg-warm-tag"
          : "border border-accent text-accent hover:bg-accent hover:text-white"
      }`}
    >
      {isPending ? "..." : isPublic ? "Unpublish" : "Publish"}
    </button>
  );
}
