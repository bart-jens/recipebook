"use client";

import { useState, useTransition } from "react";
import { shareRecipe, unshareRecipe } from "./actions";

export function ShareButton({
  recipeId,
  isShared,
  existingNotes,
}: {
  recipeId: string;
  isShared: boolean;
  existingNotes?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState(existingNotes || "");

  function handleShare() {
    setShowModal(false);
    startTransition(async () => {
      await shareRecipe(recipeId, notes.trim() || null);
    });
  }

  function handleUnshare() {
    startTransition(async () => {
      await unshareRecipe(recipeId);
    });
  }

  if (isShared) {
    return (
      <button
        onClick={handleUnshare}
        disabled={isPending}
        className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border disabled:opacity-50"
      >
        {isPending ? "..." : "Shared"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="rounded-md border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-white disabled:opacity-50"
      >
        {isPending ? "..." : "Share"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Share this recipe</h3>
            <p className="mt-1 text-sm text-warm-gray">
              Your followers will see a recommendation card with the title, source, and your rating.
            </p>
            <div className="mt-4">
              <label htmlFor="share-notes" className="block text-sm font-medium text-warm-gray">
                Any changes you made?
              </label>
              <textarea
                id="share-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Doubled the chili oil, used fresh noodles..."
                rows={3}
                className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
