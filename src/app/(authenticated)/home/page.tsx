import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";
import { ForkDot } from "@/components/logo";

interface RecentRecipe {
  id: string;
  title: string;
  image_url: string | null;
  updated_at: string;
}

interface FeedItem {
  event_type: "cooked" | "published";
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: profile },
    { data: recent },
    { data: followingData },
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("recipes")
      .select("id, title, image_url, updated_at")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id),
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

      {/* Recently Updated */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Recently Updated
          </h2>
          <Link
            href="/recipes"
            className="text-sm text-warm-gray hover:text-accent"
          >
            See all
          </Link>
        </div>
        {(recent || []).length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
            <ForkDot size={20} color="rgba(45,95,93,0.3)" />
            <p className="mt-3 text-warm-gray">No recipes yet.</p>
            <Link
              href="/recipes/new"
              className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
            >
              Create your first recipe
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(recent as RecentRecipe[]).map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group overflow-hidden rounded-md border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm"
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
                    <ForkDot size={20} color="rgba(45,95,93,0.2)" />
                  </div>
                )}
                <div className="p-3">
                  <p className="line-clamp-1 font-sans text-sm font-medium">
                    {recipe.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Your Chefs — Activity Feed */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Your Chefs</h2>
        <div className="mt-4">
          {followingCount === 0 ? (
            <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
              <ForkDot size={20} color="rgba(45,95,93,0.3)" />
              <p className="mt-3 font-medium">Find Chefs to follow</p>
              <p className="mt-1 text-sm text-warm-gray">See what other Chefs are cooking, their favorites, and recommendations</p>
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
              <p className="mt-3 text-warm-gray">Your Chefs haven&apos;t been cooking lately</p>
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

    </div>
  );
}
