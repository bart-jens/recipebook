"use client";

import { useState, useTransition } from "react";
import { StarRating } from "./star-rating";
import { addRating, deleteRating } from "./actions";

interface RatingEntry {
  id: string;
  rating: number;
  notes: string | null;
  cooked_date: string | null;
  created_at: string;
}

export function CookingLog({
  recipeId,
  ratings,
}: {
  recipeId: string;
  ratings: RatingEntry[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [stars, setStars] = useState(0);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) return;
    startTransition(async () => {
      await addRating(recipeId, stars, notes || null, date || null);
      setShowForm(false);
      setStars(0);
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
    });
  }

  function handleDelete(ratingId: string) {
    startTransition(async () => {
      await deleteRating(ratingId);
    });
  }

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-warm-divider pb-2">
        <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">
          Cooking Log
        </h2>
        {avgRating != null && (
          <span className="flex items-center gap-1 text-sm text-warm-gray">
            <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {avgRating.toFixed(1)} avg ({ratings.length} time{ratings.length !== 1 ? "s" : ""} cooked)
          </span>
        )}
      </div>

      {ratings.length === 0 && !showForm && (
        <p className="mb-4 text-sm text-warm-gray/60">You haven&apos;t cooked this yet.</p>
      )}

      {ratings.length > 0 && (
        <div className="mb-4 space-y-3">
          {ratings.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-md bg-warm-tag p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <StarRating value={entry.rating} readonly size="sm" />
                  {entry.cooked_date && (
                    <span className="text-xs text-warm-gray">
                      {new Date(entry.cooked_date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <p className="mt-1 text-sm text-warm-gray">{entry.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={isPending}
                className="ml-2 text-xs text-warm-gray/40 hover:text-accent disabled:opacity-50"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-md bg-warm-tag p-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-warm-gray">Rating</label>
            <StarRating value={stars} onChange={setStars} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-warm-gray">Date cooked</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-warm-gray">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="How did it turn out?"
              className="w-full rounded-md bg-white px-3 py-1.5 text-sm placeholder:text-warm-gray/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={stars === 0 || isPending}
              className="rounded-md bg-cta px-4 py-1.5 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md bg-warm-tag px-4 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-warm-tag px-4 py-2 text-sm text-warm-gray hover:bg-warm-border"
        >
          I cooked this
        </button>
      )}
    </div>
  );
}
