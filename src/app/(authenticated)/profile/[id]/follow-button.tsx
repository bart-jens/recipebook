"use client";

import { useTransition } from "react";
import { followUser, unfollowUser } from "../actions";

export function FollowButton({
  userId,
  isFollowing,
}: {
  userId: string;
  isFollowing: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
        isFollowing
          ? "border border-warm-border text-warm-gray hover:bg-warm-tag"
          : "bg-accent text-white hover:bg-accent-hover"
      }`}
    >
      {isPending ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
