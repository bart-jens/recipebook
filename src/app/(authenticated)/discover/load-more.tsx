"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface LoadedRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  creator_name: string;
}

export function LoadMoreButton({
  searchQuery,
  initialOffset,
  pageSize,
}: {
  searchQuery: string;
  sortBy: string;
  filterTag: string;
  initialOffset: number;
  pageSize: number;
}) {
  const [recipes, setRecipes] = useState<LoadedRecipe[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    setLoading(true);
    const supabase = createClient();

    const query = supabase
      .from("recipes")
      .select("id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (searchQuery) {
      query.ilike("title", `%${searchQuery}%`);
    }

    const { data } = await query;
    const newRecipes = (data || []) as { id: string; title: string; description: string | null; image_url: string | null; prep_time_minutes: number | null; cook_time_minutes: number | null; created_by: string }[];

    if (newRecipes.length < pageSize) {
      setHasMore(false);
    }

    // Get creator names
    const creatorIds = Array.from(new Set(newRecipes.map((r) => r.created_by)));
    const { data: profiles } = creatorIds.length > 0
      ? await supabase.from("user_profiles").select("id, display_name").in("id", creatorIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));

    const enriched = newRecipes.map((r) => ({
      ...r,
      creator_name: profileMap.get(r.created_by) || "Unknown",
    }));

    setRecipes((prev) => [...prev, ...enriched]);
    setOffset((prev) => prev + pageSize);
    setLoading(false);
  };

  return (
    <>
      {recipes.map((recipe) => {
        const timeInfo = [
          recipe.prep_time_minutes && `${recipe.prep_time_minutes} min prep`,
          recipe.cook_time_minutes && `${recipe.cook_time_minutes} min cook`,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="group block overflow-hidden rounded-md bg-warm-tag border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm"
          >
            {recipe.image_url ? (
              <div className="aspect-[16/10] overflow-hidden bg-warm-tag">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-warm-tag">
                <span className="text-2xl font-sans font-medium text-white/80">
                  {recipe.title.slice(0, 1)}
                </span>
              </div>
            )}
            <div className="p-4">
              <h2 className="font-sans text-lg font-medium">{recipe.title}</h2>
              <p className="mt-0.5 text-xs text-warm-gray">by {recipe.creator_name}</p>
              {recipe.description && (
                <p className="mt-1 text-sm text-warm-gray line-clamp-2">{recipe.description}</p>
              )}
              {timeInfo && (
                <p className="mt-2 text-xs text-warm-gray">{timeInfo}</p>
              )}
            </div>
          </Link>
        );
      })}

      {hasMore && (
        <div className="py-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-md bg-warm-tag px-6 py-2 text-sm font-medium text-warm-gray hover:bg-warm-border disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
