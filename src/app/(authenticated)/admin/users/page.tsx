import { createAdminClient } from "@/lib/supabase/admin";
import { UserList } from "./user-list";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const admin = createAdminClient();

  // Get all users with their recipe counts
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name, role, plan, created_at")
    .order("created_at", { ascending: false });

  // Get emails from auth.users via admin API
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(
    (authData?.users || []).map((u) => [u.id, u.email])
  );

  // Get recipe counts per user
  // Use exact count per user via individual queries grouped by the profiles we already have
  const { count: totalRecipes } = await admin
    .from("recipes")
    .select("id", { count: "exact", head: true });

  // Fetch all recipe created_by values (override default 1000-row limit)
  const { data: recipeCounts } = await admin
    .from("recipes")
    .select("created_by")
    .limit(totalRecipes ?? 10000);

  const countMap = new Map<string, number>();
  for (const r of recipeCounts || []) {
    countMap.set(r.created_by, (countMap.get(r.created_by) || 0) + 1);
  }

  const users = (profiles || []).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) || "unknown",
    displayName: p.display_name,
    role: p.role,
    plan: p.plan,
    recipeCount: countMap.get(p.id) || 0,
    createdAt: p.created_at,
  }));

  // Filter by search query
  const filtered = q
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(q.toLowerCase()) ||
          u.displayName.toLowerCase().includes(q.toLowerCase())
      )
    : users;

  return (
    <div>
      <h2 className="mb-4 text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
        Users ({filtered.length})
      </h2>
      <UserList users={filtered} query={q || ""} />
    </div>
  );
}
