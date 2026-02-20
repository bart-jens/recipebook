import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";

interface FeedItem {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
}

interface HomeRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  recipe_tags: { tag: string }[];
}

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: profile },
    { data: followingData },
    { data: favorites },
    { data: recentRecipes },
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id),
    supabase
      .from("recipe_favorites")
      .select(
        "recipe_id, recipes(id, title, description, image_url, prep_time_minutes, cook_time_minutes, recipe_tags(tag))"
      )
      .eq("user_id", user.id)
      .limit(8),
    supabase
      .from("recipes")
      .select(
        "id, title, description, image_url, prep_time_minutes, cook_time_minutes, recipe_tags(tag)"
      )
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const displayName = profile?.display_name || "Chef";
  const followingCount = (followingData || []).length;

  // Activity feed via RPC
  let feedItems: FeedItem[] = [];
  if (followingCount > 0) {
    const { data } = await supabase.rpc("get_activity_feed", {
      p_user_id: user.id,
      p_limit: 20,
    });
    feedItems = (data || []) as FeedItem[];
  }

  // Build recipe list: favorites first, fall back to recent recipes
  const favoriteRecipes: HomeRecipe[] = (favorites || [])
    .map(
      (f: { recipes: HomeRecipe | HomeRecipe[] | null }) => {
        const r = f.recipes;
        if (Array.isArray(r)) return r[0] ?? null;
        return r;
      }
    )
    .filter(Boolean) as HomeRecipe[];

  const allRecipes: HomeRecipe[] =
    favoriteRecipes.length > 0
      ? favoriteRecipes
      : ((recentRecipes || []) as HomeRecipe[]);

  // Featured: first recipe with an image
  const featuredIndex = allRecipes.findIndex((r) => r.image_url);
  const featured = featuredIndex >= 0 ? allRecipes[featuredIndex] : null;
  const indexRecipes = allRecipes.filter((_, i) => i !== featuredIndex);

  const totalRecipeCount = allRecipes.length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* 1. Compact Masthead */}
      <div className="flex items-baseline justify-between px-5 py-2.5 border-b border-border animate-fade-in opacity-0 anim-delay-1">
        <span className="font-display italic text-[15px] text-ink-secondary">
          {greeting()}, {displayName}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
          {formatDate()}
        </span>
      </div>

      {/* 2. Double Rule */}
      <div className="mx-5 border-t-[3px] border-t-ink border-b border-b-ink pt-[3px] animate-fade-in opacity-0 anim-delay-2" />

      {/* 3. Featured Recipe */}
      {featured && (
        <div className="px-5 pt-3.5 pb-5 animate-fade-in-up opacity-0 anim-delay-3">
          <div className="mono-label mb-2.5">Featured</div>
          <div className="grid grid-cols-[1fr_130px] gap-4">
            <div>
              {featured.recipe_tags?.[0] && (
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent font-medium mb-1">
                  {featured.recipe_tags[0].tag}
                </div>
              )}
              <Link
                href={`/recipes/${featured.id}`}
                className="block font-display text-[28px] leading-[1.05] tracking-[-0.03em] text-ink hover:text-accent transition-colors mb-2"
              >
                {featured.title}
              </Link>
              {featured.description && (
                <p className="text-[13px] font-light text-ink-secondary line-clamp-2 mb-2">
                  {featured.description}
                </p>
              )}
              <div className="font-mono text-[11px] text-ink-muted flex items-center gap-2.5">
                <span>By {displayName}</span>
                {formatTime(featured.cook_time_minutes) && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-border" />
                    <span>{formatTime(featured.cook_time_minutes)}</span>
                  </>
                )}
              </div>
            </div>
            <Link href={`/recipes/${featured.id}`} className="block">
              <img
                src={featured.image_url!}
                alt={featured.title}
                className="w-[130px] h-[170px] object-cover transition-transform duration-[400ms] hover:scale-[1.04]"
              />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Thin Rule */}
      <hr className="rule-thin mx-5 border-0 animate-fade-in opacity-0 anim-delay-4" />

      {/* 5. Numbered Recipe Index */}
      {indexRecipes.length > 0 && (
        <div className="px-5 animate-fade-in-up opacity-0 anim-delay-5">
          <div className="flex items-baseline justify-between py-3">
            <h2 className="font-display text-[18px] tracking-[-0.02em]">
              Your Recipes
            </h2>
            <span className="font-mono text-[11px] text-ink-muted">
              {totalRecipeCount} total
            </span>
          </div>
          {indexRecipes.map((recipe, i) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group flex gap-3 py-3 border-t border-border cursor-pointer transition-all duration-200 hover:bg-accent-light hover:-mx-2.5 hover:px-2.5"
            >
              <div className="font-display text-[32px] leading-none text-border min-w-[28px] pt-0.5 transition-colors group-hover:text-accent">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                {recipe.recipe_tags?.[0] && (
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent font-medium mb-px">
                    {recipe.recipe_tags[0].tag}
                  </div>
                )}
                <div className="font-display text-[20px] leading-[1.15] tracking-[-0.02em] text-ink mb-[3px] transition-colors group-hover:text-accent">
                  {recipe.title}
                </div>
                <div className="font-mono text-[11px] text-ink-muted flex gap-2.5">
                  {formatTime(recipe.cook_time_minutes) && (
                    <span>{formatTime(recipe.cook_time_minutes)}</span>
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
          ))}
        </div>
      )}

      {/* 6. Thin Rule */}
      <hr className="rule-thin mx-5 border-0 mt-3 animate-fade-in opacity-0 anim-delay-6" />

      {/* 7. Activity Ticker */}
      <div className="px-5 pb-24 animate-fade-in-up opacity-0 anim-delay-7">
        <div className="py-3">
          <h2 className="font-display text-[18px] tracking-[-0.02em]">
            Activity
          </h2>
        </div>
        {followingCount === 0 ? (
          <div className="border-t border-border py-6 text-center">
            <p className="text-[13px] font-light text-ink-secondary mb-2">
              Follow some chefs to see what they&apos;re cooking
            </p>
            <Link
              href="/discover?tab=chefs"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent hover:text-ink transition-colors"
            >
              Discover Chefs
            </Link>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="border-t border-border py-6 text-center">
            <p className="text-[13px] font-light text-ink-secondary mb-2">
              Your chefs haven&apos;t been cooking lately
            </p>
            <Link
              href="/recipes"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent hover:text-ink transition-colors"
            >
              Why not cook something yourself?
            </Link>
          </div>
        ) : (
          <ActivityFeed
            initialItems={feedItems}
            userId={user.id}
            hasMore={feedItems.length === 20}
          />
        )}
      </div>
    </div>
  );
}
