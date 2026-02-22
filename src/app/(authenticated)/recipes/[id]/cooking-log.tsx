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
      <div className="flex items-center justify-between text-[11px] font-normal tracking-[0.02em] mb-2.5 pb-1.5 border-b border-border">
        <span>Cooking Log</span>
        <div className="flex items-center gap-3">
          {cookEntries.length > 0 && (
            <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
              {cookEntries.length}x cooked
            </span>
          )}
          {avgRating != null && (
            <span className="flex items-center gap-1 text-[11px] font-normal tracking-[0.02em] text-ink-muted">
              <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {cookEntries.length === 0 && !showCookForm && (
        <p className="mb-4 text-[13px] font-light text-ink-muted">You haven&apos;t cooked this yet.</p>
      )}

      {cookEntries.length > 0 && (
        <div className="mb-4 space-y-1">
          {cookEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between py-2 border-b border-dotted border-border"
            >
              <div className="flex-1">
                <span className="text-[11px] font-normal tracking-[0.02em] text-ink">
                  {new Date(entry.cooked_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {entry.notes && (
                  <p className="mt-0.5 text-[13px] font-light text-ink-secondary">{entry.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteCook(entry.id)}
                disabled={isPending}
                className="ml-2 text-[10px] text-ink-muted/40 hover:text-accent disabled:opacity-50"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {showCookForm ? (
        <form onSubmit={handleCookSubmit} className="mb-6 border border-border p-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-normal tracking-[0.02em] text-ink-muted">Date cooked</label>
            <input
              type="date"
              value={cookDate}
              onChange={(e) => setCookDate(e.target.value)}
              className="bg-surface px-3 py-1.5 text-[13px] font-light text-ink border border-border focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-normal tracking-[0.02em] text-ink-muted">Notes (optional)</label>
            <textarea
              value={cookNotes}
              onChange={(e) => setCookNotes(e.target.value)}
              rows={2}
              placeholder="How did it turn out?"
              className="w-full bg-surface px-3 py-1.5 text-[13px] font-light text-ink border border-border placeholder:text-ink-muted/40 focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-4 py-2 hover:bg-ink/80 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isPending ? "Logging..." : "Log Cook"}
            </button>
            <button
              type="button"
              onClick={() => setShowCookForm(false)}
              className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink px-4 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCookForm(true)}
          className="mb-6 text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-4 py-2 hover:bg-ink/80 active:scale-[0.98] transition-all"
        >
          Cooked It
        </button>
      )}

      <div className="border-t border-border pt-4">
        <div className="text-[11px] font-normal tracking-[0.02em] mb-2.5 pb-1.5 border-b border-border">
          Ratings
        </div>

        {!hasCooked ? (
          <p className="text-[13px] font-light text-ink-muted">Cook this recipe to leave a rating.</p>
        ) : (
          <>
            {ratings.length > 0 && (
              <div className="mb-4 space-y-1">
                {ratings.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between py-2 border-b border-dotted border-border"
                  >
                    <div className="flex-1">
                      <StarRating value={entry.rating} readonly size="sm" />
                      {entry.notes && (
                        <p className="mt-1 text-[13px] font-light text-ink-secondary">{entry.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteRating(entry.id)}
                      disabled={isPending}
                      className="ml-2 text-[10px] text-ink-muted/40 hover:text-accent disabled:opacity-50"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showRatingForm ? (
              <form onSubmit={handleRatingSubmit} className="border border-border p-4 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-normal tracking-[0.02em] text-ink-muted">Rating</label>
                  <StarRating value={stars} onChange={setStars} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-normal tracking-[0.02em] text-ink-muted">Notes (optional)</label>
                  <textarea
                    value={ratingNotes}
                    onChange={(e) => setRatingNotes(e.target.value)}
                    rows={2}
                    placeholder="What did you think?"
                    className="w-full bg-surface px-3 py-1.5 text-[13px] font-light text-ink border border-border placeholder:text-ink-muted/40 focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={stars === 0 || isPending}
                    className="text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-4 py-2 hover:bg-ink/80 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Rating"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingForm(false)}
                    className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink px-4 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowRatingForm(true)}
                className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink border border-border px-4 py-2 transition-colors"
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
