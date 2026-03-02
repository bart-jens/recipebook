"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/format";

interface LoadedRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  creator_name: string;
  tags: string[];
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
      .select("id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (searchQuery) {
      query.ilike("title", `%${searchQuery}%`);
    }

    const { data } = await query;
    let newRecipes = (data || []) as { id: string; title: string; description: string | null; image_url: string | null; prep_time_minutes: number | null; cook_time_minutes: number | null; created_by: string; recipe_tags: { tag: string }[] }[];

    // Also find public recipes matching by ingredient or tag
    if (searchQuery) {
      const titleIds = new Set(newRecipes.map((r) => r.id));
      const allLoadedIds = new Set([...recipes.map((r) => r.id), ...Array.from(titleIds)]);
      const [{ data: ingMatches }, { data: tagMatches }] = await Promise.all([
        supabase.from("recipe_ingredients").select("recipe_id").ilike("ingredient_name", `%${searchQuery}%`),
        supabase.from("recipe_tags").select("recipe_id").ilike("tag", `%${searchQuery}%`),
      ]);
      const extraIds = new Set<string>();
      for (const m of [...(ingMatches || []), ...(tagMatches || [])]) {
        if (!allLoadedIds.has(m.recipe_id)) extraIds.add(m.recipe_id);
      }
      if (extraIds.size > 0) {
        const { data: extraData } = await supabase
          .from("recipes")
          .select("id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)")
          .eq("visibility", "public")
          .in("id", Array.from(extraIds));
        newRecipes = [...newRecipes, ...(extraData || []) as typeof newRecipes];
      }
    }

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
      id: r.id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      prep_time_minutes: r.prep_time_minutes,
      cook_time_minutes: r.cook_time_minutes,
      creator_name: profileMap.get(r.created_by) || "Unknown",
      tags: (r.recipe_tags || []).map((t) => t.tag),
    }));

    setRecipes((prev) => [...prev, ...enriched]);
    setOffset((prev) => prev + pageSize);
    setLoading(false);
  };

  return (
    <>
      {recipes.map((recipe) => {
        const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
        const timeStr = formatTime(totalTime);

        return (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="group flex gap-3 py-3.5 border-b border-border cursor-pointer transition-all duration-200 hover:bg-accent-light hover:-mx-2 hover:px-2"
          >
            <div className="flex-1 min-w-0">
              {recipe.tags[0] && (
                <div className="text-[11px] font-normal tracking-[0.02em] text-accent mb-0.5">
                  {recipe.tags[0]}
                </div>
              )}
              <div className="text-[20px] font-normal leading-[1.12] text-ink transition-colors group-hover:text-accent">
                {recipe.title}
              </div>
              {recipe.description && (
                <p className="text-[13px] font-light text-ink-secondary line-clamp-2 mb-1.5">
                  {recipe.description}
                </p>
              )}
              <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted flex gap-2.5">
                <span>By {recipe.creator_name}</span>
                {timeStr && <span>{timeStr}</span>}
              </div>
            </div>
            {recipe.image_url && (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-[56px] h-[56px] object-cover shrink-0 self-center transition-transform duration-300 group-hover:scale-[1.08]"
              />
            )}
          </Link>
        );
      })}

      {hasMore && (
        <div className="py-6 text-center border-b border-border">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
