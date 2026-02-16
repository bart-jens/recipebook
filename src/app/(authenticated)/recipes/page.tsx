import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
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
  recipe_tags: RecipeTag[];
  recipe_ratings: RecipeRating[];
}

interface EnrichedRecipe extends RecipeRow {
  avgRating: number | null;
  ratingCount: number;
  isFavorited: boolean;
  hasCooked: boolean;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; tag?: string; course?: string; filter?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const q = searchParams.q || "";
  const sort = searchParams.sort || "updated";
  const tag = searchParams.tag || "";
  const course = searchParams.course || "";
  const filter = searchParams.filter || "";

  const selectFields = "id, title, description, image_url, prep_time_minutes, cook_time_minutes, updated_at, recipe_tags(tag), recipe_ratings(rating)";

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

  // Merge owned + saved
  let merged = [
    ...(ownedRecipes || []),
    ...(savedRecipes || []),
  ] as unknown as RecipeRow[];

  // Filter by tag
  if (tag) {
    merged = merged.filter(
      (r) => r.recipe_tags && r.recipe_tags.some((t) => t.tag === tag)
    );
  }

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
    };
  });

  // Apply interaction filters
  let filtered = enriched;
  if (filter === "favorited") {
    filtered = filtered.filter((r) => r.isFavorited);
  } else if (filter === "want-to-cook") {
    filtered = filtered.filter((r) => !r.hasCooked);
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Recipes</h1>
          <div className="flex gap-2">
            <Link
              href="/recipes/import"
              className="rounded-md bg-warm-tag px-4 py-2 text-sm font-medium text-warm-gray hover:bg-warm-border"
            >
              Import Recipe
            </Link>
            <Link
              href="/recipes/new"
              className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform"
            >
              Create
            </Link>
          </div>
        </div>
      </div>

      <CollectionsSection
        collections={collections}
        userPlan={userPlan}
        collectionCount={collections.length}
      />

      <div className="mb-6">
        <RecipeListControls />
      </div>

      <p className="mb-4 text-sm text-warm-gray">
        {q
          ? `${totalCount} result${totalCount !== 1 ? "s" : ""} for \u201c${q}\u201d`
          : `${totalCount} recipe${totalCount !== 1 ? "s" : ""}`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-accent/20 bg-accent/5 p-8 text-center">
          <p className="text-warm-gray">
            {q ? "No recipes match your search." : "No recipes yet."}
          </p>
          {!q && (
            <div className="mt-2 flex gap-3 justify-center">
              <Link
                href="/recipes/import"
                className="text-sm font-medium text-accent underline"
              >
                Import a recipe
              </Link>
              <span className="text-warm-border">or</span>
              <Link
                href="/recipes/new"
                className="text-sm font-medium text-accent underline"
              >
                Create your own
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe, i) => {
            const timeInfo = [
              recipe.prep_time_minutes && `${recipe.prep_time_minutes} min prep`,
              recipe.cook_time_minutes && `${recipe.cook_time_minutes} min cook`,
            ]
              .filter(Boolean)
              .join(" · ");

            const tags: string[] = (recipe.recipe_tags || []).map((t) => t.tag);

            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block rounded-md bg-warm-tag p-4 border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm animate-fade-in-up"
                style={i < 10 ? { animationDelay: `${i * 30}ms`, animationFillMode: "backwards" } : undefined}
              >
                <div className="flex gap-4">
                  {recipe.image_url && (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-sans text-lg font-medium">{recipe.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {recipe.avgRating != null && (
                      <span className="flex items-center gap-1 text-xs text-warm-gray">
                        <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {recipe.avgRating.toFixed(1)}
                      </span>
                    )}
                    {recipe.isFavorited && (
                      <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                {recipe.description && (
                  <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {tags.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-full bg-warm-tag px-2 py-0.5 text-xs text-warm-gray"
                    >
                      {t}
                    </span>
                  ))}
                  {timeInfo && (
                    <span className="text-xs text-warm-gray">{timeInfo}</span>
                  )}
                </div>
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
