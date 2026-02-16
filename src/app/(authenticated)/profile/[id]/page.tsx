import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "./follow-button";
import { RecommendationCard } from "../../components/recommendation-card";

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If viewing your own profile, redirect to /profile
  if (user?.id === params.id) {
    redirect("/profile");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!profile) notFound();

  // Check follow state
  let followState: "not_following" | "following" | "requested" = "not_following";
  if (user) {
    const { data: follow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", params.id)
      .single();

    if (follow) {
      followState = "following";
    } else {
      const { data: request } = await supabase
        .from("follow_requests")
        .select("id")
        .eq("requester_id", user.id)
        .eq("target_id", params.id)
        .single();
      if (request) {
        followState = "requested";
      }
    }
  }

  const canViewContent = !profile.is_private || followState === "following";

  // Fetch recipes only if allowed
  let recipes: { id: string; title: string; description: string | null; updated_at: string; recipe_ratings: { rating: number }[] }[] = [];
  let shareCards: { share_id: string; user_id: string; recipe_id: string; share_notes: string | null; shared_at: string; title: string; source_url: string | null; source_name: string | null; source_type: string; image_url: string | null; tags: string[] | null; user_rating: number | null }[] = [];
  if (canViewContent) {
    const [{ data: recipeData }, { data: shareData }] = await Promise.all([
      supabase
        .from("recipes")
        .select("id, title, description, updated_at, recipe_ratings(rating)")
        .eq("created_by", params.id)
        .eq("visibility", "public")
        .order("updated_at", { ascending: false }),
      supabase
        .from("recipe_share_cards")
        .select("*")
        .eq("user_id", params.id)
        .order("shared_at", { ascending: false }),
    ]);
    recipes = (recipeData || []) as typeof recipes;
    shareCards = (shareData || []) as typeof shareCards;
  }

  const { data: ratings } = await supabase
    .from("recipe_ratings")
    .select("id")
    .eq("user_id", params.id);

  const { data: followers } = await supabase
    .from("user_follows")
    .select("id")
    .eq("following_id", params.id);

  const { data: following } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", params.id);

  const timesCooked = (ratings || []).length;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-tag text-2xl font-semibold text-warm-gray">
              {profile.display_name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {profile.display_name}
            </h1>
            {profile.role === "creator" && (
              <span className="text-xs font-medium text-accent">Creator</span>
            )}
            {profile.is_private && (
              <span className="text-xs text-warm-gray">Private account</span>
            )}
          </div>
        </div>
        {user && (
          <FollowButton
            userId={params.id}
            state={followState}
            isPrivate={profile.is_private}
          />
        )}
      </div>

      {profile.bio && (
        <p className="mb-6 text-warm-gray leading-relaxed">{profile.bio}</p>
      )}

      <div className="mb-8 flex gap-6">
        {canViewContent && (
          <>
            <div className="text-center">
              <p className="text-xl font-semibold">{recipes.length}</p>
              <p className="text-xs text-warm-gray">recipes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">{timesCooked}</p>
              <p className="text-xs text-warm-gray">times cooked</p>
            </div>
          </>
        )}
        <div className="text-center">
          <p className="text-xl font-semibold">{(followers || []).length}</p>
          <p className="text-xs text-warm-gray">followers</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{(following || []).length}</p>
          <p className="text-xs text-warm-gray">following</p>
        </div>
      </div>

      {!canViewContent ? (
        <div className="rounded-md border border-warm-border bg-warm-tag/30 p-8 text-center">
          <p className="text-sm text-warm-gray">This account is private</p>
          <p className="mt-1 text-xs text-warm-gray/60">
            Follow this user to see their recipes and cooking activity.
          </p>
        </div>
      ) : recipes.length > 0 ? (
        <div>
          <div className="mb-4 border-b border-warm-divider pb-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">
              Published Recipes
            </h2>
          </div>
          <div className="space-y-3">
            {recipes.map((recipe) => {
              const ratings = recipe.recipe_ratings || [];
              const avg =
                ratings.length > 0
                  ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                  : null;

              return (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="block rounded-md border border-warm-border bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif font-medium">{recipe.title}</h3>
                    {avg != null && (
                      <span className="flex items-center gap-1 text-xs text-warm-gray">
                        <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {recipe.description && (
                    <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-warm-gray/60">No published recipes yet.</p>
      )}

      {/* Recommendations */}
      {canViewContent && shareCards.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 border-b border-warm-divider pb-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">
              Recommendations
            </h2>
          </div>
          <div className="space-y-3">
            {shareCards.map((card) => (
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
                sharerName={profile.display_name}
                sharerAvatarUrl={profile.avatar_url}
                sharerId={params.id}
                recipeId={card.recipe_id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
