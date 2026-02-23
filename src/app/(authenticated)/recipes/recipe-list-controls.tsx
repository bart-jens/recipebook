"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const SORT_OPTIONS = [
  { value: "updated", label: "Recent" },
  { value: "alpha", label: "A-Z" },
  { value: "rating", label: "Top Rated" },
  { value: "quickest", label: "Quickest" },
];

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "favorited", label: "Favorited" },
  { value: "saved", label: "Saved" },
  { value: "published", label: "Published" },
];

const COURSE_OPTIONS = [
  { value: "", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "appetizer", label: "Appetizer" },
  { value: "side dish", label: "Side" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snack" },
];

export function RecipeListControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "updated";
  const course = searchParams.get("course") || "";
  const filter = searchParams.get("filter") || "";

  const hasActiveFilter = sort !== "updated" || !!course;
  const [showFilters, setShowFilters] = useState(hasActiveFilter);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    startTransition(() => {
      router.replace(`/recipes?${params.toString()}`);
    });
  }

  function handleSearch(value: string) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateParams({ q: value });
    }, 300);
  }

  return (
    <div>
      {/* Search — bottom-border style */}
      <div className="flex items-center gap-2 pb-1.5 border-b-2 border-ink focus-within:border-accent transition-colors duration-300">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink-muted shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search recipes, ingredients, tags..."
          defaultValue={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-body text-[15px] font-light text-ink placeholder:text-ink-muted"
        />
        {isPending && (
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent" />
        )}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`shrink-0 flex items-center gap-1 text-[11px] font-normal tracking-[0.02em] transition-colors ${
            showFilters ? "text-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Filter
          {hasActiveFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Filter tabs — always visible */}
      <div className="flex items-center border-b border-border">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={`filter-${opt.value}`}
            onClick={() => updateParams({ filter: opt.value })}
            className={`relative text-[11px] font-normal tracking-[0.02em] bg-transparent border-none cursor-pointer px-0 pr-3 py-1.5 transition-colors ${
              filter === opt.value
                ? "text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {opt.label}
            {filter === opt.value && (
              <span className="absolute bottom-[-1px] left-0 right-[12px] h-[1.5px] bg-ink" />
            )}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="border-b border-border">
          <div className="flex gap-0 mt-0">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams({ sort: opt.value })}
                className={`relative text-[11px] font-normal tracking-[0.02em] bg-transparent border-none cursor-pointer px-0 pr-3.5 py-2 transition-colors ${
                  sort === opt.value
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
                {sort === opt.value && (
                  <span className="absolute bottom-[-1px] left-0 right-[14px] h-0.5 bg-ink" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0 pb-2">
            {COURSE_OPTIONS.map((opt) => (
              <button
                key={`course-${opt.value}`}
                onClick={() => updateParams({ course: opt.value })}
                className={`relative text-[11px] font-normal tracking-[0.02em] bg-transparent border-none cursor-pointer px-0 pr-3.5 py-1 transition-colors ${
                  course === opt.value
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
