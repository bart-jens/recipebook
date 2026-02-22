"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

const TABS = [
  { value: "recipes", label: "Recipes" },
  { value: "chefs", label: "Chefs" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

export function DiscoverControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const tab = searchParams.get("tab") || "recipes";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const tag = searchParams.get("tag") || "";

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
      router.replace(`/discover?${params.toString()}`);
    });
  }

  function handleSearch(value: string) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateParams({ q: value });
    }, 300);
  }

  // Determine active tab value — combine tab and sort into unified tabs
  const activeTab = tab === "chefs" ? "chefs" : sort === "rating" ? "rating" : sort === "newest" || sort === "" ? (tab === "recipes" || tab === "" ? "recipes" : tab) : "recipes";

  function handleTabClick(value: string) {
    if (value === "chefs") {
      updateParams({ tab: "chefs", sort: "" });
    } else if (value === "newest") {
      updateParams({ tab: "", sort: "newest" });
    } else if (value === "rating") {
      updateParams({ tab: "", sort: "rating" });
    } else {
      // "recipes" — default
      updateParams({ tab: "", sort: "newest" });
    }
  }

  return (
    <div>
      {/* Search — bottom-border style */}
      <div className="px-5 mb-0">
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
            placeholder="Search recipes or chefs"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-body text-[15px] font-light text-ink placeholder:text-ink-muted"
          />
          {isPending && (
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent" />
          )}
        </div>

        {/* Active tag filter */}
        {tag && (
          <div className="mt-2">
            <button
              onClick={() => updateParams({ tag: "" })}
              className="inline-flex items-center gap-1 text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors"
            >
              {tag}
              <span className="ml-0.5 text-ink-muted">&times;</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 px-5 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabClick(t.value)}
            className={`relative text-[11px] font-normal tracking-[0.02em] bg-transparent border-none cursor-pointer px-0 pr-3.5 py-2 transition-colors ${
              activeTab === t.value
                ? "text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
            {activeTab === t.value && (
              <span className="absolute bottom-[-1px] left-0 right-[14px] h-0.5 bg-ink" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
