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
      className={`rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
        isActive
          ? "border border-warm-border text-warm-gray hover:bg-warm-tag"
          : "bg-accent text-white hover:bg-accent-hover"
      }`}
    >
      {isPending ? "..." : label}
    </button>
  );
}
