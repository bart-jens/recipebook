import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ForkDot } from "@/components/logo";
import { DiscoverControls } from "./discover-controls";
import { LoadMoreButton } from "./load-more";
import { ChefsTab } from "./chefs-tab";
import { DiscoverSaveButton } from "./discover-save-button";

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
  creator_name: string;
}

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; tag?: string; tab?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tab = searchParams.tab || "recipes";
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

  // When searching, also find public recipes matching by ingredient or tag
  if (q) {
    const titleMatchedIds = new Set(filtered.map((r) => r.id));
    const [{ data: ingMatches }, { data: tagMatches }] = await Promise.all([
      supabase.from("recipe_ingredients").select("recipe_id").ilike("ingredient_name", `%${q}%`),
      supabase.from("recipe_tags").select("recipe_id").ilike("tag", `%${q}%`),
    ]);
    const extraIds = new Set<string>();
    for (const m of [...(ingMatches || []), ...(tagMatches || [])]) {
      if (!titleMatchedIds.has(m.recipe_id)) extraIds.add(m.recipe_id);
    }
    if (extraIds.size > 0) {
      const { data: extraData } = await supabase
        .from("recipes")
        .select("id, title, description, image_url, prep_time_minutes, cook_time_minutes, published_at, created_by, recipe_tags(tag), recipe_ratings(rating)")
        .eq("visibility", "public")
        .in("id", Array.from(extraIds));
      const extras = (extraData || []) as unknown as PublicRecipe[];
      filtered = [...filtered, ...extras];
    }
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
      creator_name: profileMap.get(r.created_by) || "Unknown",
    };
  });

  // Fetch saved recipe IDs for current user
  const savedRecipeIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
    for (const s of saved || []) savedRecipeIds.add(s.recipe_id);
  }

  // Sort
  if (sort === "rating") {
    enriched.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  } else if (sort === "popular") {
    enriched.sort((a, b) => b.ratingCount - a.ratingCount);
  }
  // "newest" is already sorted by DB

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-4 animate-fade-in-up opacity-0 anim-delay-1">
        <div className="mono-label mb-1">Explore</div>
        <h1 className="font-display text-[32px] tracking-[-0.03em] mb-3.5">
          Discover
        </h1>
      </div>

      {/* Controls: Search + Tabs */}
      <div className="animate-fade-in-up opacity-0 anim-delay-2">
        <DiscoverControls />
      </div>

      {tab === "chefs" ? (
        <div className="animate-fade-in-up opacity-0 anim-delay-3">
          <ChefsTab />
        </div>
      ) : (
        <>
          {/* Result count */}
          <div className="px-5 pt-3 animate-fade-in-up opacity-0 anim-delay-3">
            <p className="font-mono text-[11px] text-ink-muted">
              {q
                ? `${enriched.length} result${enriched.length !== 1 ? "s" : ""} for \u201c${q}\u201d`
                : `${enriched.length} published recipe${enriched.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {enriched.length === 0 ? (
            <div className="mx-5 mt-4 border-t border-border py-8 text-center animate-fade-in-up opacity-0 anim-delay-4">
              <ForkDot size={24} color="rgba(139,69,19,0.2)" />
              <p className="mt-3 text-[13px] font-light text-ink-secondary">
                {q ? "No recipes match your search." : "No published recipes yet. Be the first!"}
              </p>
            </div>
          ) : (
            <div className="px-5 pb-24">
              {enriched.map((recipe, i) => {
                const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
                const timeStr = formatTime(totalTime);
                const tags = (recipe.recipe_tags || []).map((t) => t.tag);

                return (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="group flex gap-3 py-3.5 border-b border-border cursor-pointer transition-all duration-200 hover:bg-accent-light hover:-mx-2 hover:px-2"
                  >
                    <div className="flex-1 min-w-0">
                      {tags[0] && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent font-medium mb-0.5">
                          {tags[0]}
                        </div>
                      )}
                      <div className="font-display text-[20px] leading-[1.12] tracking-[-0.02em] text-ink transition-colors group-hover:text-accent">
                        {recipe.title}
                      </div>
                      {recipe.description && (
                        <p className="text-[13px] font-light text-ink-secondary line-clamp-2 mb-1.5">
                          {recipe.description}
                        </p>
                      )}
                      <div className="font-mono text-[11px] text-ink-muted flex gap-2.5 items-center">
                        <span>By {recipe.creator_name}</span>
                        {timeStr && <span>{timeStr}</span>}
                        {recipe.avgRating != null && (
                          <span>{recipe.avgRating.toFixed(1)}</span>
                        )}
                        {user && recipe.created_by !== user.id && (
                          <DiscoverSaveButton
                            recipeId={recipe.id}
                            isSaved={savedRecipeIds.has(recipe.id)}
                          />
                        )}
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
        </>
      )}
    </div>
  );
}
