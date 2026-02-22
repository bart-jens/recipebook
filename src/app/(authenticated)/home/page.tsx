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

  const totalRecipeCount = allRecipes.length;

  return (
    <div>
      {/* Recipe Carousel */}
      {allRecipes.length > 0 && (
        <div className="animate-fade-in-up opacity-0 anim-delay-3">
          <div className="flex items-baseline justify-between px-5 pt-3.5 pb-2">
            <h2 className="text-[20px] font-normal">Your Recipes</h2>
            <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
              {totalRecipeCount} total
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-4 scrollbar-hide">
            {allRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group shrink-0 w-[140px] cursor-pointer"
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-[140px] h-[140px] object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-[140px] h-[140px] bg-surface-alt" />
                )}
                <div className="pt-2">
                  {recipe.recipe_tags?.[0] && (
                    <div className="text-[11px] font-normal tracking-[0.02em] text-accent mb-0.5">
                      {recipe.recipe_tags[0].tag}
                    </div>
                  )}
                  <div className="text-[14px] font-normal leading-[1.2] text-ink line-clamp-2 transition-colors group-hover:text-accent">
                    {recipe.title}
                  </div>
                  {(recipe.cook_time_minutes || recipe.prep_time_minutes) && (
                    <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mt-0.5">
                      {formatTime(recipe.cook_time_minutes || recipe.prep_time_minutes)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Thin Rule */}
      <hr className="rule-thin mx-5 border-0 animate-fade-in opacity-0 anim-delay-4" />

      {/* Activity */}
      <div className="px-5 pb-24 animate-fade-in-up opacity-0 anim-delay-5">
        <div className="py-3">
          <h2 className="text-[20px] font-normal">
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
              className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors"
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
              className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors"
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
