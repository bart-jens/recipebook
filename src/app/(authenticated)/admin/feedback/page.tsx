import { createAdminClient } from "@/lib/supabase/admin";
import { FeedbackList } from "./feedback-list";

export default async function AdminFeedbackPage() {
  const admin = createAdminClient();

  const { data: feedback } = await admin
    .from("feedback")
    .select("id, user_id, message, platform, app_version, source_screen, status, created_at")
    .order("created_at", { ascending: false });

  // Get user names
  const userIds = Array.from(new Set((feedback || []).map((f) => f.user_id)));
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name")
    .in("id", userIds.length > 0 ? userIds : ["__none__"]);

  const nameMap = new Map(
    (profiles || []).map((p) => [p.id, p.display_name])
  );

  const enriched = (feedback || []).map((f) => ({
    id: f.id,
    userName: nameMap.get(f.user_id) || "Unknown",
    message: f.message,
    platform: f.platform as "web" | "mobile",
    appVersion: f.app_version,
    sourceScreen: f.source_screen,
    status: f.status as "new" | "read" | "resolved",
    createdAt: f.created_at,
  }));

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-warm-gray">
        Feedback ({enriched.length})
      </h2>
      <FeedbackList items={enriched} />
    </div>
  );
}
