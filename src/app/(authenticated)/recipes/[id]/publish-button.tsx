"use client";

import { useState, useTransition } from "react";
import { publishRecipe, unpublishRecipe } from "./actions";

export function PublishButton({
  recipeId,
  isPublic,
  publishCount,
  userPlan,
}: {
  recipeId: string;
  isPublic: boolean;
  publishCount?: number;
  userPlan?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const isFree = userPlan === "free";
  const atLimit = isFree && (publishCount ?? 0) >= 10;

  function handleClick() {
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    startTransition(async () => {
      if (isPublic) {
        await unpublishRecipe(recipeId);
      } else {
        await publishRecipe(recipeId);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          disabled={isPending || (!isPublic && atLimit)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            isPublic
              ? "border border-warm-border text-warm-gray hover:bg-warm-tag"
              : "border border-accent text-accent hover:bg-accent hover:text-white"
          }`}
        >
          {isPending ? "..." : isPublic ? "Unpublish" : "Publish"}
        </button>
        {isFree && !isPublic && (
          <span className="text-xs text-warm-gray">
            {atLimit ? (
              <span className="text-red-500">10/10 published — upgrade for unlimited</span>
            ) : (
              `${publishCount ?? 0}/10 published`
            )}
          </span>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">
              {isPublic ? "Unpublish recipe?" : "Publish recipe?"}
            </h3>
            <p className="mt-2 text-sm text-warm-gray">
              {isPublic
                ? "This will remove the recipe from public discovery. Continue?"
                : "Publishing will make this recipe visible to everyone. Continue?"}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
              >
                {isPublic ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
