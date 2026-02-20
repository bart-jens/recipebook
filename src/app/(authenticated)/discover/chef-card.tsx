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
    <div className="flex items-center gap-3 py-3.5 border-b border-border transition-all duration-200 hover:bg-accent-light hover:-mx-2 hover:px-2">
      <Link href={`/profile/${id}`} className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-11 w-11 rounded-full object-cover transition-transform duration-300 hover:scale-[1.08]"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg font-display text-[18px]">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${id}`}
          className="block truncate font-display text-[18px] leading-[1.2] tracking-[-0.01em] text-ink hover:text-accent transition-colors"
        >
          {displayName}
        </Link>
        <p className="font-mono text-[11px] text-ink-muted flex gap-2">
          <span>{recipeCount} recipe{recipeCount !== 1 ? "s" : ""}</span>
          {lastCooked && (
            <span>Cooked {formatTimeAgo(lastCooked)}</span>
          )}
        </p>
      </div>
      <button
        onClick={handleFollow}
        disabled={isPending}
        className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] px-3 py-1.5 transition-all disabled:opacity-50 ${
          followState === "following"
            ? "border border-border text-ink-muted hover:border-accent hover:text-accent"
            : "bg-ink text-bg hover:bg-accent"
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
