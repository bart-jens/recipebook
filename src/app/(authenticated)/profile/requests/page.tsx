import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestActions } from "./request-actions";

export default async function FollowRequestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_private")
    .eq("id", user.id)
    .single();

  if (!profile?.is_private) {
    redirect("/profile");
  }

  const { data: requests } = await supabase
    .from("follow_requests")
    .select("id, requester_id, created_at")
    .eq("target_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch requester profiles
  const requesterIds = (requests || []).map((r) => r.requester_id);
  const { data: profiles } = requesterIds.length > 0
    ? await supabase
        .from("user_profiles")
        .select("id, display_name, avatar_url")
        .in("id", requesterIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/profile" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to profile
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">Follow Requests</h1>

      {(requests || []).length === 0 ? (
        <p className="text-sm text-warm-gray/60">No pending follow requests.</p>
      ) : (
        <div className="space-y-3">
          {(requests || []).map((request) => {
            const requester = profileMap.get(request.requester_id);
            return (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-md bg-warm-tag p-4 border border-warm-border"
              >
                <Link
                  href={`/profile/${request.requester_id}`}
                  className="flex items-center gap-3"
                >
                  {requester?.avatar_url ? (
                    <img
                      src={requester.avatar_url}
                      alt={requester.display_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-tag text-sm font-semibold text-warm-gray">
                      {(requester?.display_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {requester?.display_name || "Unknown"}
                  </span>
                </Link>
                <RequestActions requesterId={request.requester_id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
