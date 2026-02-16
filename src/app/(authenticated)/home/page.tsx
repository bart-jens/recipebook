import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RecommendationCard } from "../components/recommendation-card";
import { ActivityFeed } from "./activity-feed";

interface RecentRecipe {
  id: string;
  title: string;
  image_url: string | null;
  updated_at: string;
}

interface TrendingRecipe {
  id: string;
  title: string;
  image_url: string | null;
  created_by: string;
}

interface FeedItem {
  event_type: "cooked" | "published" | "forked";
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
    { data: trending },
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
      .from("recipes")
      .select("id, title, image_url, created_by")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .limit(6),
    supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id),
  ]);

  const displayName = profile?.display_name || "Chef";
  const followingCount = (followingData || []).length;

  // Get creator names for trending recipes
  const creatorIds = Array.from(
    new Set((trending || []).map((r) => r.created_by))
  );
  const { data: profiles } =
    creatorIds.length > 0
      ? await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", creatorIds)
      : { data: [] };
  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p.display_name])
  );

  // Activity feed via RPC
  let feedItems: FeedItem[] = [];
  if (followingCount > 0) {
    const { data } = await supabase.rpc("get_activity_feed", {
      p_user_id: user.id,
      p_limit: 20,
    });
    feedItems = (data || []) as FeedItem[];
  }

  // Recommendation cards from followed users
  const ids = (followingData || []).map((f) => f.following_id);
  let shareCards: {
    share_id: string;
    user_id: string;
    recipe_id: string;
    share_notes: string | null;
    shared_at: string;
    title: string;
    source_url: string | null;
    source_name: string | null;
    source_type: string;
    image_url: string | null;
    tags: string[] | null;
    user_rating: number | null;
  }[] = [];
  let sharerProfiles: Map<string, { display_name: string; avatar_url: string | null }> = new Map();

  if (ids.length > 0) {
    const { data: cards } = await supabase
      .from("recipe_share_cards")
      .select("*")
      .in("user_id", ids)
      .order("shared_at", { ascending: false })
      .limit(10);

    shareCards = (cards || []) as typeof shareCards;

    if (shareCards.length > 0) {
      const sharerIds = Array.from(new Set(shareCards.map((c) => c.user_id)));
      const { data: sharerData } = await supabase
        .from("user_profiles")
        .select("id, display_name, avatar_url")
        .in("id", sharerIds);
      sharerProfiles = new Map(
        (sharerData || []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );
    }
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
          <div className="mt-4 rounded-md border border-accent/20 bg-accent/5 p-8 text-center">
            <p className="text-warm-gray">No recipes yet.</p>
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
                  <div className="flex aspect-[16/10] items-center justify-center bg-warm-tag">
                    <span className="text-sm font-medium text-white/80">
                      {recipe.title.slice(0, 1)}
                    </span>
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

      {/* Friends are cooking — Activity Feed */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Friends are cooking</h2>
        <div className="mt-4">
          {followingCount === 0 ? (
            <div className="rounded-md border border-accent/20 bg-accent/5 p-8 text-center">
              <p className="text-warm-gray">Follow friends to see what they&apos;re cooking</p>
              <Link
                href="/discover"
                className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
              >
                Browse Discover to find people
              </Link>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="rounded-md border border-accent/20 bg-accent/5 p-8 text-center">
              <p className="text-warm-gray">Your friends haven&apos;t been cooking lately</p>
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

      {/* Friend Recommendations */}
      {shareCards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">
            Friend Recommendations
          </h2>
          <div className="mt-4 space-y-3">
            {shareCards.map((card) => {
              const sharer = sharerProfiles.get(card.user_id);
              return (
                <RecommendationCard
                  key={card.share_id}
                  shareId={card.share_id}
                  title={card.title}
                  sourceUrl={card.source_url}
                  sourceName={card.source_name}
                  sourceType={card.source_type}
                  imageUrl={card.image_url}
                  tags={card.tags}
                  userRating={card.user_rating}
                  shareNotes={card.share_notes}
                  sharedAt={card.shared_at}
                  sharerName={sharer?.display_name || "Unknown"}
                  sharerAvatarUrl={sharer?.avatar_url || null}
                  sharerId={card.user_id}
                  recipeId={card.recipe_id}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Discover / Trending */}
      {(trending || []).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Discover</h2>
            <Link
              href="/discover"
              className="text-sm text-warm-gray hover:text-accent"
            >
              Browse
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(trending as TrendingRecipe[]).map((recipe) => (
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
                  <div className="flex aspect-[16/10] items-center justify-center bg-warm-tag">
                    <span className="text-sm font-medium text-white/80">
                      {recipe.title.slice(0, 1)}
                    </span>
                  </div>
                )}
                <div className="p-3">
                  <p className="line-clamp-1 font-sans text-sm font-medium">
                    {recipe.title}
                  </p>
                  <p className="mt-0.5 text-xs text-warm-gray">
                    by {profileMap.get(recipe.created_by) || "Unknown"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
