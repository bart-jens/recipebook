"use client";

import { useTransition } from "react";
import { forkRecipe } from "./actions";

export function ForkButton({ recipeId }: { recipeId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await forkRecipe(recipeId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag disabled:opacity-50"
    >
      {isPending ? "Forking..." : "Save to my recipes"}
    </button>
  );
}
