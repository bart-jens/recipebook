import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ForkDot } from "@/components/logo";
import { SignOutButton } from "./sign-out-button";
import FeedbackButton from "@/components/feedback-modal";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, visibility, image_url, updated_at")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false });

  const { data: ratings } = await supabase
    .from("recipe_ratings")
    .select("id")
    .eq("user_id", user.id);

  const { data: followers } = await supabase
    .from("user_follows")
    .select("id")
    .eq("following_id", user.id);

  // Count pending follow requests (only for private profiles)
  let pendingRequestCount = 0;
  if (profile?.is_private) {
    const { count } = await supabase
      .from("follow_requests")
      .select("id", { count: "exact", head: true })
      .eq("target_id", user.id);
    pendingRequestCount = count || 0;
  }

  // Count new followers since last seen
  const { data: newFollowerCount } = await supabase
    .rpc("get_new_follower_count", { p_user_id: user.id });

  const publicCount = (recipes || []).filter((r) => r.visibility === "public").length;
  const totalRecipes = (recipes || []).length;
  const timesCooked = (ratings || []).length;
  const followerCount = (followers || []).length;

  return (
    <div>
      {/* Profile Top */}
      <div className="px-5 pt-6 flex gap-4 items-start animate-fade-in-up opacity-0 anim-delay-1">
        {profile?.avatar_url ? (
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
            {(profile?.display_name || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-[28px] leading-none tracking-[-0.03em] text-ink">
              {profile?.display_name || "Anonymous"}
            </h1>
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] px-1 py-0.5 border border-border text-ink-muted">
              {profile?.plan === "premium" ? "Premium" : "Free"}
            </span>
          </div>
          {profile?.bio && (
            <p className="mt-1 text-[13px] font-light text-ink-secondary leading-[1.45]">
              {profile.bio}
            </p>
          )}
          {profile?.is_private && (
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">
              Private account
            </p>
          )}
        </div>
      </div>

      {/* Follow requests banner */}
      {pendingRequestCount > 0 && (
        <Link
          href="/profile/requests"
          className="mx-5 mt-4 flex items-center justify-between border border-accent/20 bg-accent-light py-2.5 px-3 transition-colors hover:bg-accent/10 animate-fade-in-up opacity-0 anim-delay-2"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink">
            Follow requests
          </span>
          <span className="font-mono text-[11px] bg-accent text-white px-1.5 py-0.5 min-w-[20px] text-center">
            {pendingRequestCount}
          </span>
        </Link>
      )}

      {/* New followers banner */}
      {(newFollowerCount ?? 0) > 0 && (
        <Link
          href="/profile/new-followers"
          className="mx-5 mt-3 flex items-center justify-between border border-accent/20 bg-accent-light py-2.5 px-3 transition-colors hover:bg-accent/10 animate-fade-in-up opacity-0 anim-delay-2"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink">
            New followers
          </span>
          <span className="font-mono text-[11px] bg-accent text-white px-1.5 py-0.5 min-w-[20px] text-center">
            {newFollowerCount! > 9 ? "9+" : newFollowerCount}
          </span>
        </Link>
      )}

      {/* Stats Bar */}
      <div className="mx-5 mt-5 flex border-t-[3px] border-t-ink border-b border-b-ink animate-fade-in-up opacity-0 anim-delay-3">
        <Link href="/recipes" className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
          <div className="font-display text-[22px] text-ink">{totalRecipes}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Recipes</div>
        </Link>
        <Link href="/recipes" className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
          <div className="font-display text-[22px] text-ink">{publicCount}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Published</div>
        </Link>
        <Link href="/recipes" className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
          <div className="font-display text-[22px] text-ink">{timesCooked}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Cooked</div>
        </Link>
        <Link href="/profile/new-followers" className="flex-1 py-2.5 text-center transition-colors hover:bg-accent-light">
          <div className="font-display text-[22px] text-ink">{followerCount}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">Followers</div>
        </Link>
      </div>

      {/* Recipe List */}
      <div className="px-5 pb-6 animate-fade-in-up opacity-0 anim-delay-4">
        <div className="flex items-baseline justify-between py-3">
          <h2 className="font-display text-[18px] tracking-[-0.02em]">Your Recipes</h2>
          <span className="font-mono text-[11px] text-ink-muted">{totalRecipes} total</span>
        </div>

        {totalRecipes === 0 ? (
          <div className="border-t border-border py-8 text-center">
            <ForkDot size={24} color="rgba(139,69,19,0.2)" />
            <p className="mt-3 text-[13px] font-light text-ink-secondary">
              No recipes yet. Start building your collection!
            </p>
          </div>
        ) : (
          <div>
            {(recipes || []).map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group flex gap-3 py-3 border-b border-border items-center cursor-pointer transition-all duration-150 hover:pl-1"
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-12 h-12 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.08]"
                    style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                  />
                ) : (
                  <div className="w-12 h-12 shrink-0 bg-surface-alt flex items-center justify-center">
                    <ForkDot size={16} color="rgba(139,69,19,0.15)" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] leading-[1.2] tracking-[-0.01em] text-ink">
                    {recipe.title}
                  </div>
                  <div className="font-mono text-[11px] text-ink-muted flex gap-2 items-center mt-0.5">
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.06em] px-1 py-0.5 border ${
                        recipe.visibility === "public"
                          ? "border-olive text-olive"
                          : "border-border text-ink-muted"
                      }`}
                    >
                      {recipe.visibility === "public" ? "Published" : "Private"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-12 flex flex-col gap-2 animate-fade-in-up opacity-0 anim-delay-5">
        <hr className="rule-thin border-0 mb-2" />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/profile/edit"
            className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 border border-ink text-ink hover:bg-ink hover:text-bg transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href="/invites"
            className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
          >
            Invite Friends
          </Link>
          <FeedbackButton sourceScreen="profile" />
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
