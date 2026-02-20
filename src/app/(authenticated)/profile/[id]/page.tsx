import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ForkDot } from "@/components/logo";
import { FollowButton } from "./follow-button";
import { ProfileTabs } from "./profile-tabs";

interface ChefProfileData {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_private: boolean;
  };
  stats: {
    recipe_count: number;
    cook_count: number;
    follower_count: number;
    following_count: number;
  };
  is_following: boolean;
  is_owner: boolean;
  can_view: boolean;
  activity: Array<{
    recipe_id: string;
    recipe_title: string;
    recipe_image_url: string | null;
    cooked_at: string;
    notes: string | null;
  }>;
  favorites: Array<{
    recipe_id: string;
    recipe_title: string;
    recipe_image_url: string | null;
    favorited_at: string;
    rating: number | null;
  }>;
  published: Array<{
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    published_at: string;
  }>;
  recommendations: Array<{
    share_id: string;
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
  }>;
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
  const { data: chefData, error } = await supabase.rpc("get_chef_profile", {
    p_chef_id: params.id,
  });

  if (error || !chefData) {
    console.error("get_chef_profile failed:", error?.message, error?.code, error?.details);
    notFound();
  }

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
    <div>
      {/* Profile Top */}
      <div className="px-5 pt-6 flex gap-4 items-start animate-fade-in-up opacity-0 anim-delay-1">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-16 h-16 rounded-full object-cover shrink-0 transition-transform duration-300"
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full bg-ink text-bg font-display text-[24px] flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-[1.08]"
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {profile.display_name[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-[28px] leading-none tracking-[-0.03em] text-ink">
                {profile.display_name}
              </h1>
              {profile.is_private && (
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">
                  Private account
                </p>
              )}
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
            <p className="mt-1 text-[13px] font-light text-ink-secondary leading-[1.45]">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mx-5 mt-5 flex border-t-[3px] border-t-ink border-b border-b-ink animate-fade-in-up opacity-0 anim-delay-2">
        {canView && (
          <>
            <div className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
              <div className="font-display text-[22px] text-ink">{stats.recipe_count}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Recipes</div>
            </div>
            <div className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
              <div className="font-display text-[22px] text-ink">{stats.cook_count}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Cooked</div>
            </div>
          </>
        )}
        <div className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light last:border-r-0">
          <div className="font-display text-[22px] text-ink">{stats.follower_count}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Followers</div>
        </div>
        <div className="flex-1 py-2.5 text-center transition-colors hover:bg-accent-light">
          <div className="font-display text-[22px] text-ink">{stats.following_count}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Following</div>
        </div>
      </div>

      {!canView ? (
        <div className="mx-5 mt-6 border-t border-border py-10 text-center animate-fade-in-up opacity-0 anim-delay-3">
          <ForkDot size={24} color="rgba(139,69,19,0.2)" />
          <p className="mt-3 font-display text-[18px] tracking-[-0.02em] text-ink">
            This account is private
          </p>
          <p className="mt-1 text-[13px] font-light text-ink-secondary">
            Follow this user to see their recipes and cooking activity.
          </p>
        </div>
      ) : (
        <div className="animate-fade-in-up opacity-0 anim-delay-3">
          <ProfileTabs
            activity={data.activity || []}
            favorites={data.favorites || []}
            published={data.published || []}
            recommendations={data.recommendations || []}
            profileName={profile.display_name}
            profileAvatarUrl={profile.avatar_url}
            profileId={params.id}
          />
        </div>
      )}
    </div>
  );
}
