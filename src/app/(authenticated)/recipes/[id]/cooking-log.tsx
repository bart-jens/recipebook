"use client";

import { useState, useTransition } from "react";
import { StarRating } from "./star-rating";
import { addRating, deleteRating, logCook, deleteCookEntry } from "./actions";

interface CookEntry {
  id: string;
  cooked_at: string;
  notes: string | null;
}

interface RatingEntry {
  id: string;
  rating: number;
  notes: string | null;
  cooked_date: string | null;
  created_at: string;
}

export function CookingLog({
  recipeId,
  cookEntries,
  ratings,
}: {
  recipeId: string;
  cookEntries: CookEntry[];
  ratings: RatingEntry[];
}) {
  const hasCooked = cookEntries.length > 0;
  const [showCookForm, setShowCookForm] = useState(false);
  const [cookNotes, setCookNotes] = useState("");
  const [cookDate, setCookDate] = useState(new Date().toISOString().split("T")[0]);

  const [showRatingForm, setShowRatingForm] = useState(false);
  const [stars, setStars] = useState(0);
  const [ratingNotes, setRatingNotes] = useState("");

  const [isPending, startTransition] = useTransition();

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

  function handleCookSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await logCook(recipeId, cookDate, cookNotes || null);
      setShowCookForm(false);
      setCookNotes("");
      setCookDate(new Date().toISOString().split("T")[0]);
    });
  }

  function handleDeleteCook(cookId: string) {
    startTransition(async () => {
      await deleteCookEntry(cookId);
    });
  }

  function handleRatingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) return;
    startTransition(async () => {
      await addRating(recipeId, stars, ratingNotes || null, null);
      setShowRatingForm(false);
      setStars(0);
      setRatingNotes("");
    });
  }

  function handleDeleteRating(ratingId: string) {
    startTransition(async () => {
      await deleteRating(ratingId);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-warm-divider pb-2">
        <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">
          Cooking Log
        </h2>
        <div className="flex items-center gap-3">
          {cookEntries.length > 0 && (
            <span className="text-sm text-warm-gray">
              Cooked {cookEntries.length} time{cookEntries.length !== 1 ? "s" : ""}
            </span>
          )}
          {avgRating != null && (
            <span className="flex items-center gap-1 text-sm text-warm-gray">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {cookEntries.length === 0 && !showCookForm && (
        <p className="mb-4 text-sm text-warm-gray/60">You haven&apos;t cooked this yet.</p>
      )}

      {cookEntries.length > 0 && (
        <div className="mb-4 space-y-2">
          {cookEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-md bg-warm-tag p-3"
            >
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {new Date(entry.cooked_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {entry.notes && (
                  <p className="mt-0.5 text-sm text-warm-gray">{entry.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteCook(entry.id)}
                disabled={isPending}
                className="ml-2 text-xs text-warm-gray/40 hover:text-accent disabled:opacity-50"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {showCookForm ? (
        <form onSubmit={handleCookSubmit} className="mb-6 rounded-md bg-warm-tag p-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-warm-gray">Date cooked</label>
            <input
              type="date"
              value={cookDate}
              onChange={(e) => setCookDate(e.target.value)}
              className="rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-warm-gray">Notes (optional)</label>
            <textarea
              value={cookNotes}
              onChange={(e) => setCookNotes(e.target.value)}
              rows={2}
              placeholder="How did it turn out?"
              className="w-full rounded-md bg-white px-3 py-1.5 text-sm placeholder:text-warm-gray/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-cta px-4 py-1.5 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isPending ? "Logging..." : "Log Cook"}
            </button>
            <button
              type="button"
              onClick={() => setShowCookForm(false)}
              className="rounded-md bg-warm-tag px-4 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCookForm(true)}
          className="mb-6 rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform"
        >
          Cooked It
        </button>
      )}

      <div className="border-t border-warm-divider pt-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-warm-gray">
          Ratings
        </h3>

        {!hasCooked ? (
          <p className="text-sm text-warm-gray/60">Cook this recipe to leave a rating.</p>
        ) : (
          <>
            {ratings.length > 0 && (
              <div className="mb-4 space-y-3">
                {ratings.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between rounded-md bg-warm-tag p-3"
                  >
                    <div className="flex-1">
                      <StarRating value={entry.rating} readonly size="sm" />
                      {entry.notes && (
                        <p className="mt-1 text-sm text-warm-gray">{entry.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteRating(entry.id)}
                      disabled={isPending}
                      className="ml-2 text-xs text-warm-gray/40 hover:text-accent disabled:opacity-50"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showRatingForm ? (
              <form onSubmit={handleRatingSubmit} className="rounded-md bg-warm-tag p-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-warm-gray">Rating</label>
                  <StarRating value={stars} onChange={setStars} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-warm-gray">Notes (optional)</label>
                  <textarea
                    value={ratingNotes}
                    onChange={(e) => setRatingNotes(e.target.value)}
                    rows={2}
                    placeholder="What did you think?"
                    className="w-full rounded-md bg-white px-3 py-1.5 text-sm placeholder:text-warm-gray/40 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={stars === 0 || isPending}
                    className="rounded-md bg-cta px-4 py-1.5 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Rating"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingForm(false)}
                    className="rounded-md bg-warm-tag px-4 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowRatingForm(true)}
                className="rounded-md bg-warm-tag px-4 py-2 text-sm text-warm-gray hover:bg-warm-border"
              >
                Add rating
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
