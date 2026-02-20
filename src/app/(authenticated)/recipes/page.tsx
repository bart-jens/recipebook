import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ForkDot } from "@/components/logo";
import { RecipeListControls } from "./recipe-list-controls";
import { CollectionsSection } from "./collections-section";
import { getCollections, getUserPlan } from "./collections/actions";

interface RecipeTag {
  tag: string;
}

interface RecipeRating {
  rating: number;
}

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  updated_at: string;
  visibility: string;
  recipe_tags: RecipeTag[];
  recipe_ratings: RecipeRating[];
}

interface EnrichedRecipe extends RecipeRow {
  avgRating: number | null;
  ratingCount: number;
  isFavorited: boolean;
  hasCooked: boolean;
  isSaved: boolean;
}

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; course?: string; filter?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const q = searchParams.q || "";
  const sort = searchParams.sort || "updated";
  const course = searchParams.course || "";
  const filter = searchParams.filter || "";

  const selectFields = "id, title, description, image_url, prep_time_minutes, cook_time_minutes, updated_at, visibility, recipe_tags(tag), recipe_ratings(rating)";

  // Fetch owned recipes, saved recipe IDs, favorites, and cook log in parallel
  let ownedQuery = supabase
    .from("recipes")
    .select(selectFields)
    .eq("created_by", user!.id);

  if (q) {
    ownedQuery = ownedQuery.ilike("title", `%${q}%`);
  }

  const [
    { data: ownedRecipes },
    { data: savedEntries },
    { data: favEntries },
    { data: cookLogEntries },
  ] = await Promise.all([
    ownedQuery,
    supabase.from("saved_recipes").select("recipe_id").eq("user_id", user!.id),
    supabase.from("recipe_favorites").select("recipe_id").eq("user_id", user!.id),
    supabase.from("cook_log").select("recipe_id").eq("user_id", user!.id),
  ]);

  const savedRecipeIds = new Set((savedEntries || []).map((s) => s.recipe_id));
  const favoritedIds = new Set((favEntries || []).map((f) => f.recipe_id));
  const cookedIds = new Set((cookLogEntries || []).map((c) => c.recipe_id));

  // Fetch saved recipe details if any
  let savedRecipes: typeof ownedRecipes = [];
  if (savedRecipeIds.size > 0) {
    let savedQuery = supabase
      .from("recipes")
      .select(selectFields)
      .in("id", Array.from(savedRecipeIds));
    if (q) {
      savedQuery = savedQuery.ilike("title", `%${q}%`);
    }
    const { data } = await savedQuery;
    savedRecipes = data;
  }

  // Merge owned + saved (title-matched)
  const titleMatched = [
    ...(ownedRecipes || []),
    ...(savedRecipes || []),
  ] as unknown as RecipeRow[];
  const titleMatchedIds = new Set(titleMatched.map((r) => r.id));

  // When searching, also find recipes matching by ingredient or tag
  let extraRecipes: RecipeRow[] = [];
  if (q) {
    const [{ data: ingMatches }, { data: tagMatches }, { data: allOwnedIdRows }] = await Promise.all([
      supabase.from("recipe_ingredients").select("recipe_id").ilike("ingredient_name", `%${q}%`),
      supabase.from("recipe_tags").select("recipe_id").ilike("tag", `%${q}%`),
      supabase.from("recipes").select("id").eq("created_by", user!.id),
    ]);
    const allOwnedIds = new Set((allOwnedIdRows || []).map((r) => r.id));
    const extraIds = new Set<string>();
    for (const m of [...(ingMatches || []), ...(tagMatches || [])]) {
      const id = m.recipe_id;
      if (!titleMatchedIds.has(id) && (allOwnedIds.has(id) || savedRecipeIds.has(id))) {
        extraIds.add(id);
      }
    }
    if (extraIds.size > 0) {
      const { data: extraData } = await supabase
        .from("recipes")
        .select(selectFields)
        .in("id", Array.from(extraIds));
      extraRecipes = (extraData || []) as unknown as RecipeRow[];
    }
  }

  let merged = [...titleMatched, ...extraRecipes] as RecipeRow[];

  // Filter by course
  if (course) {
    merged = merged.filter(
      (r) => r.recipe_tags && r.recipe_tags.some((t) => t.tag.toLowerCase() === course.toLowerCase())
    );
  }

  // Enrich with computed fields
  const enriched: EnrichedRecipe[] = merged.map((r) => {
    const ratings = r.recipe_ratings || [];
    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length
        : null;
    return {
      ...r,
      avgRating: avg,
      ratingCount: ratings.length,
      isFavorited: favoritedIds.has(r.id),
      hasCooked: cookedIds.has(r.id),
      isSaved: savedRecipeIds.has(r.id),
    };
  });

  // Apply interaction filters
  let filtered = enriched;
  if (filter === "favorited") {
    filtered = filtered.filter((r) => r.isFavorited);
  } else if (filter === "saved") {
    filtered = filtered.filter((r) => r.isSaved);
  } else if (filter === "published") {
    filtered = filtered.filter((r) => r.visibility === "public");
  }

  // Sort: favorites first, then by chosen sort
  filtered.sort((a, b) => {
    if (a.isFavorited !== b.isFavorited) return a.isFavorited ? -1 : 1;
    if (sort === "rating") {
      return (b.avgRating || 0) - (a.avgRating || 0);
    }
    if (sort === "alpha") {
      return a.title.localeCompare(b.title);
    }
    if (sort === "prep") {
      return (a.prep_time_minutes || 999) - (b.prep_time_minutes || 999);
    }
    if (sort === "cook") {
      return (a.cook_time_minutes || 999) - (b.cook_time_minutes || 999);
    }
    // Default: updated
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const totalCount = filtered.length;

  const [collections, userPlan] = await Promise.all([
    getCollections(),
    getUserPlan(),
  ]);

  return (
    <div>
      {/* Header: overline + serif title + action buttons */}
      <div className="px-5 pt-4 animate-fade-in-up opacity-0 anim-delay-1">
        <div className="mono-label mb-1">Your Library</div>
        <div className="flex items-baseline justify-between mb-3.5">
          <h1 className="font-display text-[32px] tracking-[-0.03em]">
            Recipes
          </h1>
          <div className="flex gap-2">
            <Link
              href="/recipes/import"
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
            >
              Import
            </Link>
            <Link
              href="/recipes/new"
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 border border-ink bg-ink text-bg hover:bg-accent hover:border-accent transition-colors"
            >
              Create
            </Link>
          </div>
        </div>
      </div>

      {/* Collections */}
      <div className="px-5 animate-fade-in-up opacity-0 anim-delay-2">
        <CollectionsSection
          collections={collections}
          userPlan={userPlan}
          collectionCount={collections.length}
        />
      </div>

      {/* Controls: Search + Sort/Filter tabs */}
      <div className="px-5 animate-fade-in-up opacity-0 anim-delay-3">
        <RecipeListControls />
      </div>

      {/* Result count */}
      <div className="px-5 pt-3 animate-fade-in-up opacity-0 anim-delay-4">
        <p className="font-mono text-[11px] text-ink-muted">
          {q
            ? `${totalCount} result${totalCount !== 1 ? "s" : ""} for \u201c${q}\u201d`
            : `${totalCount} recipe${totalCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Recipe list */}
      {filtered.length === 0 ? (
        <div className="mx-5 mt-4 border-t border-border py-8 text-center animate-fade-in-up opacity-0 anim-delay-5">
          <ForkDot size={24} color="rgba(139,69,19,0.2)" />
          <p className="mt-3 text-[13px] font-light text-ink-secondary">
            {q ? "No recipes match your search." : "No recipes yet."}
          </p>
          {!q && (
            <div className="mt-2 flex gap-3 justify-center">
              <Link
                href="/recipes/import"
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent hover:underline"
              >
                Import a recipe
              </Link>
              <span className="text-ink-muted">or</span>
              <Link
                href="/recipes/new"
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent hover:underline"
              >
                Create your own
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 pb-24">
          {filtered.map((recipe, i) => {
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
            const timeStr = formatTime(totalTime);
            const tags: string[] = (recipe.recipe_tags || []).map((t) => t.tag);

            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group flex gap-3 py-3.5 border-b border-border cursor-pointer transition-all duration-200 hover:bg-accent-light hover:-mx-2 hover:px-2 animate-fade-in-up opacity-0"
                style={i < 10 ? { animationDelay: `${(i + 5) * 40}ms` } : undefined}
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-12 h-12 object-cover shrink-0 self-center transition-transform duration-300 group-hover:scale-[1.08]"
                    style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                  />
                ) : (
                  <div className="w-12 h-12 shrink-0 self-center bg-surface-alt flex items-center justify-center">
                    <ForkDot size={14} color="rgba(139,69,19,0.15)" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {tags[0] && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent font-medium mb-0.5">
                          {tags[0]}
                        </div>
                      )}
                      <div className="font-display text-[20px] leading-[1.12] tracking-[-0.02em] text-ink transition-colors group-hover:text-accent truncate">
                        {recipe.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      {recipe.isFavorited && (
                        <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-ink-muted flex gap-2.5 mt-0.5">
                    {timeStr && <span>{timeStr}</span>}
                    {recipe.avgRating != null && (
                      <span>{recipe.avgRating.toFixed(1)}</span>
                    )}
                    {tags.length > 1 && (
                      <span>{tags.slice(1).join(", ")}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
