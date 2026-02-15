"use client";

import { useTransition } from "react";
import { approveFollowRequest, denyFollowRequest } from "../actions";

export function RequestActions({ requesterId }: { requesterId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      await approveFollowRequest(requesterId);
    });
  }

  function handleDeny() {
    startTransition(async () => {
      await denyFollowRequest(requesterId);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={handleDeny}
        disabled={isPending}
        className="rounded-md border border-warm-border px-3 py-1.5 text-xs text-warm-gray hover:bg-warm-tag disabled:opacity-50"
      >
        Deny
      </button>
    </div>
  );
}
