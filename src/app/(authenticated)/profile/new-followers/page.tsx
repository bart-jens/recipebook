import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewFollowersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch new followers BEFORE marking seen
  const { data: newFollowers } = await supabase.rpc("get_new_followers", {
    p_user_id: user.id,
  });

  // Mark all followers as seen
  await supabase.rpc("mark_followers_seen");

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/profile" className="font-mono text-[10px] uppercase tracking-widest text-ink-secondary hover:text-accent">
          &larr; Back to profile
        </Link>
      </div>

      <h1 className="mb-6 font-display text-3xl text-ink">New Followers</h1>

      {(newFollowers || []).length === 0 ? (
        <p className="font-body text-sm text-ink-muted">No new followers.</p>
      ) : (
        <div className="space-y-3">
          {(newFollowers || []).map((follower) => (
            <Link
              key={follower.follower_id}
              href={`/profile/${follower.follower_id}`}
              className="flex items-center gap-3 border border-border bg-surface p-4 transition-all hover:-translate-y-px hover:border-border-strong"
            >
              {follower.avatar_url ? (
                <img
                  src={follower.avatar_url}
                  alt={follower.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt font-display text-sm text-ink-secondary">
                  {(follower.display_name || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="font-body text-sm font-medium text-ink">
                {follower.display_name || "Unknown"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
