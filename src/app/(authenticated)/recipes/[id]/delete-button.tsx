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
        className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted hover:text-red-500 flex items-center gap-1 transition-all active:scale-[0.94]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
      {error && (
        <p className="mt-1 text-[10px] text-red-500">{error}</p>
      )}
    </div>
  );
}
