"use client";

import { useState, useTransition } from "react";
import { revokeInvite } from "../actions";

interface Invite {
  id: string;
  inviterName: string;
  email: string;
  code: string;
  usedAt: string | null;
  createdAt: string;
}

export function InviteList({ invites }: { invites: Invite[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke(inviteId: string) {
    startTransition(async () => {
      const result = await revokeInvite(inviteId);
      if (result.error) {
        alert(result.error);
      }
      setConfirmId(null);
    });
  }

  return (
    <div className="space-y-2">
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between border border-border bg-surface px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-body text-sm font-medium text-ink">{inv.email}</p>
              <span
                className={`shrink-0 font-mono text-[10px] uppercase tracking-widest ${
                  inv.usedAt
                    ? "text-olive"
                    : "text-ink-muted"
                }`}
              >
                {inv.usedAt ? "Joined" : "Pending"}
              </span>
            </div>
            <p className="font-mono text-[10px] text-ink-secondary">
              Invited by {inv.inviterName} &middot;{" "}
              <span className="uppercase tracking-widest">{inv.code}</span> &middot;{" "}
              {new Date(inv.createdAt).toLocaleDateString()}
            </p>
          </div>

          {!inv.usedAt && (
            <div className="ml-4 shrink-0">
              {confirmId === inv.id ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-red-600">Revoke?</span>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={isPending}
                    className="bg-red-600 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? "..." : "Yes"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-secondary hover:border-ink hover:text-ink"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(inv.id)}
                  className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-red-600 hover:bg-red-50"
                >
                  Revoke
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {invites.length === 0 && (
        <p className="py-8 text-center font-body text-sm text-ink-muted">No invites found</p>
      )}
    </div>
  );
}
