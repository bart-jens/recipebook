import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { RecipeListControls } from "./recipe-list-controls";

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
  is_favorite: boolean;
  updated_at: string;
  recipe_tags: RecipeTag[];
  recipe_ratings: RecipeRating[];
}

interface EnrichedRecipe extends RecipeRow {
  avgRating: number | null;
  ratingCount: number;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; tag?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q || "";
  const sort = searchParams.sort || "updated";
  const tag = searchParams.tag || "";

  let query = supabase
    .from("recipes")
    .select("id, title, description, image_url, prep_time_minutes, cook_time_minutes, is_favorite, updated_at, recipe_tags(tag), recipe_ratings(rating)");

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (tag) {
    // Filter recipes that have this tag via inner join
    query = query.eq("recipe_tags.tag", tag);
  }

  if (sort === "alpha") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data: recipes } = await query;

  // Filter out recipes that don't actually have the tag (Supabase returns all recipes with empty tag array)
  let filtered = (recipes || []) as unknown as RecipeRow[];
  if (tag) {
    filtered = filtered.filter(
      (r) => r.recipe_tags && r.recipe_tags.length > 0
    );
  }

  // Compute average ratings and sort
  const enriched: EnrichedRecipe[] = filtered.map((r) => {
    const ratings = r.recipe_ratings || [];
    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length
        : null;
    return { ...r, avgRating: avg, ratingCount: ratings.length };
  });

  // Sort: favorites first, then by chosen sort
  enriched.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    if (sort === "rating") {
      return (b.avgRating || 0) - (a.avgRating || 0);
    }
    return 0; // already sorted by DB
  });

  const totalCount = enriched.length;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Recipes</h1>
          <Link
            href="/recipes/new"
            className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover"
          >
            + New recipe
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/recipes/import-url"
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Import URL
          </Link>
          <Link
            href="/recipes/import-instagram"
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Import Instagram
          </Link>
          <Link
            href="/recipes/import-photo"
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Import Photo
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <RecipeListControls />
      </div>

      <p className="mb-4 text-sm text-warm-gray">
        {q
          ? `${totalCount} result${totalCount !== 1 ? "s" : ""} for \u201c${q}\u201d`
          : `${totalCount} recipe${totalCount !== 1 ? "s" : ""}`}
      </p>

      {enriched.length === 0 ? (
        <div className="rounded-md border border-dashed border-warm-border p-8 text-center">
          <p className="text-warm-gray">
            {q ? "No recipes match your search." : "No recipes yet."}
          </p>
          {!q && (
            <div className="mt-2 flex gap-3 justify-center">
              <Link
                href="/recipes/new"
                className="text-sm font-medium text-accent underline"
              >
                Create your first recipe
              </Link>
              <span className="text-warm-border">or</span>
              <Link
                href="/recipes/import-url"
                className="text-sm font-medium text-accent underline"
              >
                Import from URL
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((recipe) => {
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
                className="block rounded-md border border-warm-border bg-white p-4 transition-shadow hover:shadow-md"
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
                  <h2 className="font-serif text-lg font-medium">{recipe.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {recipe.avgRating != null && (
                      <span className="flex items-center gap-1 text-xs text-warm-gray">
                        <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {recipe.avgRating.toFixed(1)}
                      </span>
                    )}
                    {recipe.is_favorite && (
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
