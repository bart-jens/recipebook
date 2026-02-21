"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

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
      </div>

      {/* Sort tabs — mono uppercase with active underline */}
      <div className="flex gap-0 border-b border-border mt-0">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParams({ sort: opt.value })}
            className={`relative font-mono text-[11px] uppercase tracking-[0.06em] bg-transparent border-none cursor-pointer px-0 pr-3.5 py-2 transition-colors ${
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

      {/* Filter tabs + Course dropdown */}
      <div className="flex items-center border-b border-border">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={`filter-${opt.value}`}
            onClick={() => updateParams({ filter: opt.value })}
            className={`relative font-mono text-[10px] uppercase tracking-[0.08em] bg-transparent border-none cursor-pointer px-0 pr-3 py-1.5 transition-colors ${
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
        <div className="ml-auto relative flex items-center">
          <select
            value={course}
            onChange={(e) => updateParams({ course: e.target.value })}
            className={`font-mono text-[10px] uppercase tracking-[0.08em] bg-transparent border-none cursor-pointer outline-none py-1.5 pr-4 appearance-none ${
              course ? "text-accent" : "text-ink-muted"
            }`}
          >
            <option value="">Course</option>
            {COURSE_OPTIONS.filter((o) => o.value).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
