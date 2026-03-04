import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";
import { InviteLinkSection } from "./invite-link-section";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eefeats.com";

export default async function InvitesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: invites }, { data: tokenRow }] = await Promise.all([
    supabase
      .from("invites")
      .select("*")
      .eq("invited_by", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_invite_tokens")
      .select("invite_token")
      .eq("user_id", user.id)
      .single(),
  ]);

  const inviteLink = tokenRow?.invite_token
    ? `${SITE_URL}/i/${tokenRow.invite_token}`
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-[26px] font-normal tracking-[-0.01em] text-ink">Invite Friends</h1>
      <p className="mb-6 text-[15px] font-light text-ink-secondary">
        EefEats is invite-only. Share codes with friends to let them join.
      </p>

      {inviteLink && <InviteLinkSection inviteLink={inviteLink} />}

      <div className="mb-8">
        <InviteForm />
      </div>

      {(invites || []).length > 0 && (
        <div>
          <div className="mb-4 border-b border-border pb-2">
            <h2 className="text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
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
                  <p className="text-[15px] font-light text-ink">{invite.email}</p>
                  <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">{invite.code}</p>
                </div>
                <span
                  className={`text-[11px] font-normal tracking-[0.02em] ${
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
