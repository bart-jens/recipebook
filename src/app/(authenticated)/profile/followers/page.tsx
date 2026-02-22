import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FollowersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all followers with their profile info
  const { data: follows } = await supabase
    .from("user_follows")
    .select("follower_id, created_at")
    .eq("following_id", user.id)
    .order("created_at", { ascending: false });

  const followerIds = (follows || []).map((f) => f.follower_id);

  let profiles: { id: string; display_name: string; avatar_url: string | null }[] = [];
  if (followerIds.length > 0) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .in("id", followerIds);
    profiles = data || [];
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const followers = (follows || []).map((f) => ({
    id: f.follower_id,
    created_at: f.created_at,
    ...profileMap.get(f.follower_id),
  }));

  return (
    <div>
      <div className="px-5 pt-4 animate-fade-in-up opacity-0 anim-delay-1">
        <Link href="/profile" className="text-[11px] font-normal tracking-[0.02em] text-ink-secondary hover:text-accent">
          &larr; Back to profile
        </Link>
        <h1 className="mt-3 text-[26px] font-normal tracking-[-0.01em] mb-1">
          Followers
        </h1>
        <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
          {followers.length} follower{followers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="px-5 pb-24 animate-fade-in-up opacity-0 anim-delay-2">
        {followers.length === 0 ? (
          <div className="border-t border-border mt-4 py-8 text-center">
            <p className="text-[13px] font-light text-ink-secondary">
              No followers yet.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            {followers.map((follower, i) => (
              <Link
                key={follower.id}
                href={`/profile/${follower.id}`}
                className="group flex items-center gap-3 py-3 border-b border-border transition-all duration-150 hover:pl-1"
                style={i < 10 ? { animationDelay: `${(i + 3) * 40}ms` } : undefined}
              >
                {follower.avatar_url ? (
                  <img
                    src={follower.avatar_url}
                    alt={follower.display_name || ""}
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bg text-[14px] font-normal shrink-0">
                    {(follower.display_name || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="font-body text-[15px] text-ink group-hover:text-accent transition-colors">
                  {follower.display_name || "Unknown"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
