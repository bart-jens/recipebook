import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ForkDot } from "@/components/logo";
import { DiscoverControls } from "./discover-controls";
import { LoadMoreButton } from "./load-more";

interface RecipeTag {
  tag: string;
}

interface RecipeRating {
  rating: number;
}

interface PublicRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  published_at: string | null;
  created_by: string;
  recipe_tags: RecipeTag[];
  recipe_ratings: RecipeRating[];
}

interface EnrichedRecipe extends PublicRecipe {
  avgRating: number | null;
  ratingCount: number;
  forkCount: number;
  creator_name: string;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; tag?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q || "";
  const sort = searchParams.sort || "newest";
  const tag = searchParams.tag || "";

  let query = supabase
    .from("recipes")
    .select("id, title, description, image_url, prep_time_minutes, cook_time_minutes, published_at, created_by, recipe_tags(tag), recipe_ratings(rating)")
    .eq("visibility", "public");

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (tag) {
    query = query.eq("recipe_tags.tag", tag);
  }

  const PAGE_SIZE = 20;
  query = query.order("published_at", { ascending: false }).limit(PAGE_SIZE);

  const { data: recipes } = await query;

  let filtered = (recipes || []) as unknown as PublicRecipe[];
  if (tag) {
    filtered = filtered.filter((r) => r.recipe_tags && r.recipe_tags.length > 0);
  }

  // Get creator names for all recipes
  const creatorIds = Array.from(new Set(filtered.map((r) => r.created_by)));
  const { data: profiles } = creatorIds.length > 0
    ? await supabase
        .from("user_profiles")
        .select("id, display_name")
        .in("id", creatorIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

  // Get fork counts
  const recipeIds = filtered.map((r) => r.id);
  const { data: forks } = recipeIds.length > 0
    ? await supabase
        .from("recipes")
        .select("forked_from_id")
        .in("forked_from_id", recipeIds)
    : { data: [] };
  const forkCounts = new Map<string, number>();
  (forks || []).forEach((f) => {
    if (f.forked_from_id) {
      forkCounts.set(f.forked_from_id, (forkCounts.get(f.forked_from_id) || 0) + 1);
    }
  });

  // Enrich
  const enriched: EnrichedRecipe[] = filtered.map((r) => {
    const ratings = r.recipe_ratings || [];
    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length
        : null;
    return {
      ...r,
      avgRating: avg,
      ratingCount: ratings.length,
      forkCount: forkCounts.get(r.id) || 0,
      creator_name: profileMap.get(r.created_by) || "Unknown",
    };
  });

  // Sort
  if (sort === "rating") {
    enriched.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  } else if (sort === "popular") {
    enriched.sort((a, b) => b.forkCount - a.forkCount);
  }
  // "newest" is already sorted by DB

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Discover</h1>
        <p className="mt-1 text-sm text-warm-gray">
          Browse recipes published by the EefEats community
        </p>
      </div>

      <div className="mb-6">
        <DiscoverControls />
      </div>

      <p className="mb-4 text-sm text-warm-gray">
        {q
          ? `${enriched.length} result${enriched.length !== 1 ? "s" : ""} for \u201c${q}\u201d`
          : `${enriched.length} published recipe${enriched.length !== 1 ? "s" : ""}`}
      </p>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
          <ForkDot size={24} color="rgba(45,95,93,0.3)" />
          <p className="mt-3 text-warm-gray">
            {q ? "No recipes match your search." : "No published recipes yet. Be the first!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((recipe, i) => {
            const timeInfo = [
              recipe.prep_time_minutes && `${recipe.prep_time_minutes} min prep`,
              recipe.cook_time_minutes && `${recipe.cook_time_minutes} min cook`,
            ]
              .filter(Boolean)
              .join(" · ");

            const tags = (recipe.recipe_tags || []).map((t) => t.tag);

            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group block overflow-hidden rounded-md bg-warm-tag border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm animate-fade-in-up"
                style={i < 10 ? { animationDelay: `${i * 30}ms`, animationFillMode: "backwards" } : undefined}
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
                  <div className="flex aspect-[16/10] items-center justify-center bg-accent/5">
                    <ForkDot size={24} color="rgba(45,95,93,0.2)" />
                  </div>
                )}
                <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h2 className="font-sans text-lg font-medium">{recipe.title}</h2>
                    <p className="mt-0.5 text-xs text-warm-gray">
                      by {recipe.creator_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {recipe.avgRating != null && (
                      <span className="flex items-center gap-1 text-xs text-warm-gray">
                        <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {recipe.avgRating.toFixed(1)}
                        <span className="text-warm-gray/50">({recipe.ratingCount})</span>
                      </span>
                    )}
                    {recipe.forkCount > 0 && (
                      <span className="text-xs text-warm-gray">
                        {recipe.forkCount} fork{recipe.forkCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                {recipe.description && (
                  <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {tags.map((t) => (
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
              </Link>
            );
          })}

          {enriched.length >= PAGE_SIZE && (
            <LoadMoreButton
              searchQuery={q}
              sortBy={sort}
              filterTag={tag}
              initialOffset={PAGE_SIZE}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>
      )}
    </div>
  );
}
