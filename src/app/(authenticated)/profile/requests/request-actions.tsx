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
        className="rounded-md bg-cta px-3 py-1.5 text-xs font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={handleDeny}
        disabled={isPending}
        className="rounded-md bg-warm-tag px-3 py-1.5 text-xs text-warm-gray hover:bg-warm-border disabled:opacity-50"
      >
        Deny
      </button>
    </div>
  );
}
