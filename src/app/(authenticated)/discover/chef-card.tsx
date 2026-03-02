"use client";

import { useTransition } from "react";
import Link from "next/link";
import { followUser, unfollowUser } from "../profile/actions";
import { formatTimeAgo } from "@/lib/format";

interface ChefCardProps {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  recipeCount: number;
  lastCooked: string | null;
  followState: "not_following" | "following";
  onFollowChange?: (id: string, newState: "not_following" | "following") => void;
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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg text-[20px] font-normal">
            {(displayName?.[0] ?? '?').toUpperCase()}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${id}`}
          className="block truncate text-[20px] font-normal leading-[1.2] text-ink hover:text-accent transition-colors"
        >
          {displayName}
        </Link>
        <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted flex gap-2">
          <span>{recipeCount} recipe{recipeCount !== 1 ? "s" : ""}</span>
          {lastCooked && (
            <span>Cooked {formatTimeAgo(lastCooked)}</span>
          )}
        </p>
      </div>
      <button
        onClick={handleFollow}
        disabled={isPending}
        className={`shrink-0 text-[11px] font-normal tracking-[0.02em] px-3 py-1.5 transition-all disabled:opacity-50 ${
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
