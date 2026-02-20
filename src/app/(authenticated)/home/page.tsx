import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";
import { ForkDot } from "@/components/logo";

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

interface SuggestionRecipe {
  id: string;
  title: string;
  image_url: string | null;
}

interface CookLogEntry {
  id: string;
  cooked_at: string;
  notes: string | null;
  recipes: {
    id: string;
    title: string;
  };
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
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
    { data: recentCooks },
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
      .select("recipe_id, recipes(id, title, image_url)")
      .eq("user_id", user.id)
      .limit(6),
    supabase
      .from("recipes")
      .select("id, title, image_url")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("cook_log")
      .select("id, cooked_at, notes, recipes(id, title)")
      .eq("user_id", user.id)
      .order("cooked_at", { ascending: false })
      .limit(3),
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

  // Suggestions: favorites first, fall back to recent recipes
  const favoriteRecipes: SuggestionRecipe[] = (favorites || [])
    .map((f: { recipes: SuggestionRecipe | SuggestionRecipe[] | null }) => {
      const r = f.recipes;
      if (Array.isArray(r)) return r[0] ?? null;
      return r;
    })
    .filter(Boolean) as SuggestionRecipe[];

  const suggestions: SuggestionRecipe[] =
    favoriteRecipes.length > 0
      ? favoriteRecipes.slice(0, 6)
      : ((recentRecipes || []) as SuggestionRecipe[]).slice(0, 6);

  const cooks = (recentCooks || []) as CookLogEntry[];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <h1 className="text-sm text-warm-gray">
        {greeting()}, {displayName}
      </h1>

      {/* Section A: Activity Feed */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Your Feed</h2>
        <div className="mt-4">
          {followingCount === 0 ? (
            <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
              <ForkDot size={20} color="rgba(45,95,93,0.3)" />
              <p className="mt-3 font-medium">Follow some chefs to see what they&apos;re cooking</p>
              <Link
                href="/discover?tab=chefs"
                className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                Discover Chefs
              </Link>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
              <ForkDot size={20} color="rgba(45,95,93,0.3)" />
              <p className="mt-3 text-warm-gray">Your chefs haven&apos;t been cooking lately</p>
              <Link
                href="/recipes"
                className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
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

      {/* Section B: Looking for something to cook? */}
      {suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Looking for something to cook?</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {suggestions.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group shrink-0 w-36 overflow-hidden rounded-md border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm"
              >
                {recipe.image_url ? (
                  <div className="aspect-[4/3] overflow-hidden bg-warm-tag">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-accent/5">
                    <ForkDot size={16} color="rgba(45,95,93,0.2)" />
                  </div>
                )}
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-medium">
                    {recipe.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section C: Your Recent Activity */}
      {cooks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Recent Activity</h2>
            <Link
              href="/recipes"
              className="text-sm text-warm-gray hover:text-accent"
            >
              See all
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {cooks.map((entry) => (
              <div key={entry.id} className="flex items-baseline gap-2 text-sm">
                <span className="shrink-0 text-xs text-warm-gray">
                  {formatTimeAgo(entry.cooked_at)}
                </span>
                <span>
                  You cooked{" "}
                  <Link
                    href={`/recipes/${entry.recipes.id}`}
                    className="font-medium hover:text-accent"
                  >
                    {entry.recipes.title}
                  </Link>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
