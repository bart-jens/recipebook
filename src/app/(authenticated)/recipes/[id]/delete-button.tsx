"use client";

import { deleteRecipe } from "./actions";

export function DeleteButton({ recipeId }: { recipeId: string }) {
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    await deleteRecipe(recipeId);
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
