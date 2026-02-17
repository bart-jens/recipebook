"use client";

import { useTransition } from "react";
import Link from "next/link";
import { followUser, unfollowUser } from "../profile/actions";

interface ChefCardProps {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  recipeCount: number;
  lastCooked: string | null;
  followState: "not_following" | "following";
  onFollowChange?: (id: string, newState: "not_following" | "following") => void;
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ChefCard({
  id,
  displayName,
  avatarUrl,
  recipeCount,
  lastCooked,
  followState,
  onFollowChange,
}: ChefCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    startTransition(async () => {
      if (followState === "following") {
        await unfollowUser(id);
        onFollowChange?.(id, "not_following");
      } else {
        await followUser(id);
        onFollowChange?.(id, "following");
      }
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-md border border-warm-border bg-warm-tag p-4 transition-all hover:-translate-y-px hover:shadow-sm">
      <Link href={`/profile/${id}`} className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${id}`}
          className="block truncate font-medium hover:text-accent"
        >
          {displayName}
        </Link>
        <p className="mt-0.5 text-xs text-warm-gray">
          {recipeCount} recipe{recipeCount !== 1 ? "s" : ""}
          {lastCooked && (
            <span> &middot; Cooked {formatTimeAgo(lastCooked)}</span>
          )}
        </p>
      </div>
      <button
        onClick={handleFollow}
        disabled={isPending}
        className={`shrink-0 rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          followState === "following"
            ? "border border-warm-border text-warm-gray hover:border-red-300 hover:text-red-500"
            : "bg-accent text-white hover:bg-accent/90"
        }`}
      >
        {isPending
          ? "..."
          : followState === "following"
            ? "Following"
            : "Follow"}
      </button>
    </div>
  );
}
