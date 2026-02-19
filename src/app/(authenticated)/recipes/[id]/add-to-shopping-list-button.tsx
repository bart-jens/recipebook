"use client";

import { useState } from "react";

export function AddToShoppingListButton({
  recipeId,
  ingredientCount,
  onAdd,
}: {
  recipeId: string;
  ingredientCount: number;
  onAdd: (recipeId: string) => Promise<{ error?: string } | undefined>;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    if (ingredientCount === 0) return;
    setAdding(true);
    const result = await onAdd(recipeId);
    setAdding(false);
    if (!result?.error) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }

  if (ingredientCount === 0) return null;

  return (
    <button
      onClick={handleAdd}
      disabled={adding}
      className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border disabled:opacity-50"
    >
      {added ? `Added ${ingredientCount} items` : adding ? "Adding..." : "Add to Grocery List"}
    </button>
  );
}
