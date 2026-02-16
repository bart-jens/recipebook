import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RecommendationCard } from "../components/recommendation-card";

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
    { data: recent },
    { data: trending },
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
  ]);

  const displayName = profile?.display_name || "Chef";

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

  // Fetch recommendation cards from followed users
  const { data: followedIds } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

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
  let activityItems: {
    id: string;
    type: "cooked" | "published";
    userName: string;
    userId: string;
    recipeTitle: string;
    recipeId: string;
    rating?: number;
    timestamp: string;
  }[] = [];

  if (followedIds && followedIds.length > 0) {
    const ids = followedIds.map((f) => f.following_id);
    const [{ data: cards }, { data: cookedActivity }, { data: publishedActivity }] =
      await Promise.all([
        supabase
          .from("recipe_share_cards")
          .select("*")
          .in("user_id", ids)
          .order("shared_at", { ascending: false })
          .limit(10),
        supabase
          .from("recipe_ratings")
          .select("id, user_id, recipe_id, rating, created_at")
          .in("user_id", ids)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("recipes")
          .select("id, title, created_by, published_at")
          .eq("visibility", "public")
          .in("created_by", ids)
          .not("published_at", "is", null)
          .order("published_at", { ascending: false })
          .limit(10),
      ]);

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

    // Build activity feed
    const activityUserIds = new Set<string>();
    const activityRecipeIds = new Set<string>();
    for (const c of cookedActivity || []) {
      activityUserIds.add(c.user_id);
      activityRecipeIds.add(c.recipe_id);
    }
    for (const p of publishedActivity || []) {
      activityUserIds.add(p.created_by);
    }

    const [{ data: actProfiles }, { data: actRecipes }] = await Promise.all([
      activityUserIds.size > 0
        ? supabase.from("user_profiles").select("id, display_name").in("id", Array.from(activityUserIds))
        : { data: [] },
      activityRecipeIds.size > 0
        ? supabase.from("recipes").select("id, title").in("id", Array.from(activityRecipeIds))
        : { data: [] },
    ]);

    const actProfileMap = new Map((actProfiles || []).map((p) => [p.id, p.display_name]));
    const actRecipeMap = new Map((actRecipes || []).map((r) => [r.id, r.title]));

    for (const c of cookedActivity || []) {
      const name = actProfileMap.get(c.user_id);
      const title = actRecipeMap.get(c.recipe_id);
      if (name && title) {
        activityItems.push({
          id: `cooked-${c.id}`,
          type: "cooked",
          userName: name,
          userId: c.user_id,
          recipeTitle: title,
          recipeId: c.recipe_id,
          rating: c.rating,
          timestamp: c.created_at,
        });
      }
    }
    for (const p of publishedActivity || []) {
      const name = actProfileMap.get(p.created_by);
      if (name) {
        activityItems.push({
          id: `published-${p.id}`,
          type: "published",
          userName: name,
          userId: p.created_by,
          recipeTitle: p.title,
          recipeId: p.id,
          timestamp: p.published_at!,
        });
      }
    }
    activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    activityItems = activityItems.slice(0, 15);
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
          <div className="mt-4 rounded-md border border-dashed border-warm-border/50 p-8 text-center">
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
                className="group overflow-hidden rounded-md border border-warm-border transition-opacity hover:opacity-80"
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

      {/* Friend Activity */}
      {activityItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Friend Activity</h2>
          <div className="mt-4 divide-y divide-warm-border/40">
            {activityItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3">
                <div className="flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/profile/${item.userId}`}
                      className="font-semibold text-warm-text hover:text-accent"
                    >
                      {item.userName}
                    </Link>
                    <span className="text-warm-gray">
                      {item.type === "cooked" ? " cooked " : " published "}
                    </span>
                    <Link
                      href={`/recipes/${item.recipeId}`}
                      className="font-medium text-warm-text hover:text-accent"
                    >
                      {item.recipeTitle}
                    </Link>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {item.type === "cooked" && item.rating && (
                      <span className="text-xs">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={i < item.rating! ? "text-amber-400" : "text-warm-border"}
                          >
                            &#9733;
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="text-xs text-warm-gray">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                className="group overflow-hidden rounded-md border border-warm-border transition-opacity hover:opacity-80"
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
