import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";

export default async function InvitesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, role")
    .eq("id", user.id)
    .single();

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .eq("invited_by", user.id)
    .order("created_at", { ascending: false });

  const limit =
    profile?.role === "creator" ? "unlimited" : profile?.plan === "premium" ? 20 : 5;
  const used = (invites || []).length;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold">Invite Friends</h1>
      <p className="mb-6 text-sm text-warm-gray">
        EefEats is invite-only. Share codes with friends to let them join.
        <span className="ml-1 font-medium">
          {limit === "unlimited" ? "Unlimited invites" : `${used}/${limit} invites used`}
        </span>
      </p>

      <div className="mb-8">
        <InviteForm />
      </div>

      {(invites || []).length > 0 && (
        <div>
          <div className="mb-4 border-b border-warm-divider pb-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">
              Your Invites
            </h2>
          </div>
          <div className="space-y-2">
            {(invites || []).map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md bg-warm-tag px-4 py-3 border border-warm-border"
              >
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="font-mono text-xs text-warm-gray">{invite.code}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    invite.used_at
                      ? "bg-green-50 text-green-700"
                      : "bg-warm-tag text-warm-gray"
                  }`}
                >
                  {invite.used_at ? "Joined" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
