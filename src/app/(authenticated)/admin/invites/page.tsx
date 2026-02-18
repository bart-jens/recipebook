import { createAdminClient } from "@/lib/supabase/admin";
import { InviteList } from "./invite-list";

export default async function AdminInvitesPage() {
  const admin = createAdminClient();

  const { data: invites } = await admin
    .from("invites")
    .select("id, invited_by, email, code, used_at, created_at")
    .order("created_at", { ascending: false });

  // Get inviter names
  const inviterIds = Array.from(new Set((invites || []).map((i) => i.invited_by)));
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name")
    .in("id", inviterIds);

  const nameMap = new Map(
    (profiles || []).map((p) => [p.id, p.display_name])
  );

  const enriched = (invites || []).map((inv) => ({
    id: inv.id,
    inviterName: nameMap.get(inv.invited_by) || "Unknown",
    email: inv.email,
    code: inv.code,
    usedAt: inv.used_at,
    createdAt: inv.created_at,
  }));

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-warm-gray">
        Invites ({enriched.length})
      </h2>
      <InviteList invites={enriched} />
    </div>
  );
}
