import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const admin = createAdminClient();

  const [
    { count: userCount },
    { count: recipeCount },
    { count: inviteCount },
    { count: pendingInviteCount },
  ] = await Promise.all([
    admin.from("user_profiles").select("id", { count: "exact", head: true }),
    admin.from("recipes").select("id", { count: "exact", head: true }),
    admin.from("invites").select("id", { count: "exact", head: true }),
    admin
      .from("invites")
      .select("id", { count: "exact", head: true })
      .is("used_at", null),
  ]);

  const stats = [
    { label: "Users", value: userCount ?? 0 },
    { label: "Recipes", value: recipeCount ?? 0 },
    { label: "Invites sent", value: inviteCount ?? 0 },
    { label: "Invites pending", value: pendingInviteCount ?? 0 },
  ];

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-warm-gray">
        Platform Overview
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-warm-border bg-white p-4"
          >
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-warm-gray">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
