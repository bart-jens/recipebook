"use client";

import { deleteRecipe } from "./actions";
import { useState } from "react";

export function DeleteButton({ recipeId }: { recipeId: string }) {
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    setError(null);
    const result = await deleteRecipe(recipeId);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
      >
        Delete
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
