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
        className="bg-ink px-3 py-1.5 text-[11px] font-normal tracking-[0.02em] text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={handleDeny}
        disabled={isPending}
        className="border border-border px-3 py-1.5 text-[11px] font-normal tracking-[0.02em] text-ink-secondary transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
      >
        Deny
      </button>
    </div>
  );
}
