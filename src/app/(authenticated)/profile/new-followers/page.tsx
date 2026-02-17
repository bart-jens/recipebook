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
        <Link href="/profile" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to profile
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">New Followers</h1>

      {(newFollowers || []).length === 0 ? (
        <p className="text-sm text-warm-gray/60">No new followers.</p>
      ) : (
        <div className="space-y-3">
          {(newFollowers || []).map((follower) => (
            <Link
              key={follower.follower_id}
              href={`/profile/${follower.follower_id}`}
              className="flex items-center gap-3 rounded-md bg-warm-tag p-4 border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm"
            >
              {follower.avatar_url ? (
                <img
                  src={follower.avatar_url}
                  alt={follower.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-tag text-sm font-semibold text-warm-gray">
                  {(follower.display_name || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">
                {follower.display_name || "Unknown"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
