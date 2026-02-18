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
          className="flex items-center justify-between rounded-md border border-warm-border bg-white px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{inv.email}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  inv.usedAt
                    ? "bg-green-50 text-green-700"
                    : "bg-warm-tag text-warm-gray"
                }`}
              >
                {inv.usedAt ? "Joined" : "Pending"}
              </span>
            </div>
            <p className="text-xs text-warm-gray">
              Invited by {inv.inviterName} &middot;{" "}
              <span className="font-mono">{inv.code}</span> &middot;{" "}
              {new Date(inv.createdAt).toLocaleDateString()}
            </p>
          </div>

          {!inv.usedAt && (
            <div className="ml-4 shrink-0">
              {confirmId === inv.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Revoke?</span>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={isPending}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? "..." : "Yes"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-md bg-warm-tag px-2 py-1 text-xs text-warm-gray hover:bg-warm-border"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(inv.id)}
                  className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Revoke
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {invites.length === 0 && (
        <p className="py-8 text-center text-sm text-warm-gray">No invites found</p>
      )}
    </div>
  );
}
