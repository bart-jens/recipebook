import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";
import { RecipeCard } from "./recipe-card";
import { EmptyState } from "@/components/ui/empty-state";

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
  recipe_visibility: string | null;
  recipe_source_type: string | null;
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


export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    ,
    { data: followingData },
    { data: recentRecipes },
    { count: totalRecipes },
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
      .from("recipes")
      .select(
        "id, title, description, image_url, prep_time_minutes, cook_time_minutes, recipe_tags(tag)"
      )
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id),
  ]);

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

  const allRecipes: HomeRecipe[] = (recentRecipes || []) as HomeRecipe[];
  const totalRecipeCount = totalRecipes ?? allRecipes.length;

  return (
    <div>
      {/* Quick actions */}
      <div className="flex justify-end gap-2 px-5 pt-3.5 pb-1 animate-fade-in opacity-0 anim-delay-1">
        <Link
          href="/recipes/import"
          className="text-[11px] font-normal tracking-[0.02em] px-3 py-2 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
        >
          Import
        </Link>
        <Link
          href="/recipes/new"
          className="text-[11px] font-normal tracking-[0.02em] px-3 py-2 border border-ink bg-ink text-bg hover:bg-accent hover:border-accent transition-colors"
        >
          Create
        </Link>
      </div>

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
              <RecipeCard key={recipe.id} recipe={recipe} />
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
          <EmptyState
            title="Follow some chefs to see what they're cooking"
            action={{ label: "Discover Chefs", href: "/discover?tab=chefs" }}
          />
        ) : feedItems.length === 0 ? (
          <EmptyState
            title="Your chefs haven't been cooking lately"
            action={{ label: "Why not cook something yourself?", href: "/recipes" }}
          />
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
