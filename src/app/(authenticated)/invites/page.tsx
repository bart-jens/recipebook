import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";

export default async function InvitesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .eq("invited_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-3xl text-ink">Invite Friends</h1>
      <p className="mb-6 font-body text-sm text-ink-secondary">
        EefEats is invite-only. Share codes with friends to let them join.
      </p>

      <div className="mb-8">
        <InviteForm />
      </div>

      {(invites || []).length > 0 && (
        <div>
          <div className="mb-4 border-b border-border pb-2">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
              Your Invites
            </h2>
          </div>
          <div className="space-y-2">
            {(invites || []).map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-body text-sm font-medium text-ink">{invite.email}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{invite.code}</p>
                </div>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest ${
                    invite.used_at
                      ? "text-olive"
                      : "text-ink-muted"
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
