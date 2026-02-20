"use client";

import { useTransition } from "react";
import { followUser, unfollowUser, cancelFollowRequest } from "../actions";

type FollowState = "not_following" | "following" | "requested";

export function FollowButton({
  userId,
  state,
  isPrivate,
}: {
  userId: string;
  state: FollowState;
  isPrivate: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (state === "following") {
        await unfollowUser(userId);
      } else if (state === "requested") {
        await cancelFollowRequest(userId);
      } else {
        await followUser(userId);
      }
    });
  }

  const label =
    state === "following"
      ? "Following"
      : state === "requested"
        ? "Requested"
        : isPrivate
          ? "Request to Follow"
          : "Follow";

  const isActive = state === "following" || state === "requested";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 border transition-colors shrink-0 disabled:opacity-50 ${
        isActive
          ? "border-border text-ink-muted hover:border-ink hover:text-ink"
          : "border-ink bg-ink text-bg hover:bg-transparent hover:text-ink"
      }`}
    >
      {isPending ? "..." : label}
    </button>
  );
}
