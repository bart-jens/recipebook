import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "./follow-button";
import { ProfileTabs } from "./profile-tabs";

interface ChefProfileData {
  profile: {
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    role: string;
    is_private: boolean;
  };
  stats: {
    recipe_count: number;
    cook_count: number;
    follower_count: number;
    following_count: number;
  };
  is_following: boolean;
  can_view: boolean;
  activity: Array<{ recipe_id: string; recipe_title: string; cooked_at: string; notes: string | null }>;
  favorites: Array<{ recipe_id: string; recipe_title: string; recipe_image_url: string | null; favorited_at: string; rating: number | null }>;
  published: Array<{ id: string; title: string; description: string | null; image_url: string | null; published_at: string }>;
  recommendations: Array<{ recipe_id: string; title: string; source_name: string | null; shared_at: string; notes: string | null }>;
}

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

  // Use the get_chef_profile RPC for all data in one call
  const { data: chefData } = await supabase.rpc("get_chef_profile", {
    p_chef_id: params.id,
  });

  if (!chefData) notFound();

  const data = chefData as unknown as ChefProfileData;
  const profile = data.profile;
  const stats = data.stats;
  const canView = data.can_view;

  // Determine follow state
  let followState: "not_following" | "following" | "requested" = "not_following";
  if (data.is_following) {
    followState = "following";
  } else if (user) {
    // Check for pending request (not included in RPC)
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
        {canView && (
          <>
            <div className="text-center">
              <p className="text-xl font-semibold">{stats.recipe_count}</p>
              <p className="text-xs text-warm-gray">recipes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">{stats.cook_count}</p>
              <p className="text-xs text-warm-gray">times cooked</p>
            </div>
          </>
        )}
        <div className="text-center">
          <p className="text-xl font-semibold">{stats.follower_count}</p>
          <p className="text-xs text-warm-gray">followers</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{stats.following_count}</p>
          <p className="text-xs text-warm-gray">following</p>
        </div>
      </div>

      {!canView ? (
        <div className="rounded-md bg-warm-tag p-8 text-center">
          <p className="text-sm text-warm-gray">This account is private</p>
          <p className="mt-1 text-xs text-warm-gray/60">
            Follow this user to see their recipes and cooking activity.
          </p>
        </div>
      ) : (
        <ProfileTabs
          activity={data.activity || []}
          favorites={data.favorites || []}
          published={data.published || []}
          recommendations={data.recommendations || []}
          profileName={profile.display_name}
          profileAvatarUrl={profile.avatar_url}
          profileId={params.id}
        />
      )}
    </div>
  );
}
