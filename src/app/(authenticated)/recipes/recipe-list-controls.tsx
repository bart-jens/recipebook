"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "alpha", label: "Alphabetical" },
  { value: "rating", label: "Highest rated" },
  { value: "prep", label: "Prep time" },
  { value: "cook", label: "Cook time" },
];

const COURSE_OPTIONS = [
  { value: "", label: "All courses" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "appetizer", label: "Appetizer" },
  { value: "side dish", label: "Side dish" },
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
  const tag = searchParams.get("tag") || "";
  const course = searchParams.get("course") || "";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          type="search"
          placeholder="Search recipes..."
          defaultValue={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-md bg-warm-tag px-3 py-2 pl-9 text-sm placeholder:text-warm-gray/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isPending && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-warm-border border-t-accent" />
        )}
      </div>
      <div className="flex items-center gap-2">
        {tag && (
          <button
            onClick={() => updateParams({ tag: "" })}
            className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
          >
            {tag}
            <span className="ml-0.5">&times;</span>
          </button>
        )}
        <select
          value={course}
          onChange={(e) => updateParams({ course: e.target.value })}
          className="rounded-md bg-warm-tag px-3 py-2 text-sm text-warm-gray focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {COURSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="rounded-md bg-warm-tag px-3 py-2 text-sm text-warm-gray focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
