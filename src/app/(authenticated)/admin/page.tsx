import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const admin = createAdminClient();

  const [
    { count: userCount },
    { count: recipeCount },
    { count: inviteCount },
    { count: pendingInviteCount },
    { count: unreadFeedbackCount },
  ] = await Promise.all([
    admin.from("user_profiles").select("id", { count: "exact", head: true }),
    admin.from("recipes").select("id", { count: "exact", head: true }),
    admin.from("invites").select("id", { count: "exact", head: true }),
    admin
      .from("invites")
      .select("id", { count: "exact", head: true })
      .is("used_at", null),
    admin
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  const stats = [
    { label: "Users", value: userCount ?? 0 },
    { label: "Recipes", value: recipeCount ?? 0 },
    { label: "Invites sent", value: inviteCount ?? 0 },
    { label: "Invites pending", value: pendingInviteCount ?? 0 },
    { label: "Unread feedback", value: unreadFeedbackCount ?? 0 },
  ];

  return (
    <div>
      <h2 className="mb-4 text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
        Platform Overview
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border bg-surface p-4"
          >
            <p className="text-[36px] font-light tracking-[-0.03em] text-ink">{stat.value}</p>
            <p className="text-[11px] font-normal tracking-[0.02em] text-ink-secondary">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
