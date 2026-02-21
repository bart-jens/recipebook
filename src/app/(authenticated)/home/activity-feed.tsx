"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface FeedItem {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function actionVerb(type: string): string {
  switch (type) {
    case "cooked":
      return " cooked ";
    case "created":
      return " published ";
    case "favorited":
      return " favorited ";
    default:
      return " ";
  }
}

function recipeLink(item: FeedItem): string {
  return `/recipes/${item.recipe_id}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex gap-px mt-px"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-[11px] ${star <= rating ? "text-accent" : "text-border"}`}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

export function ActivityFeed({
  initialItems,
  userId,
  hasMore: initialHasMore,
}: {
  initialItems: FeedItem[];
  userId: string;
  hasMore: boolean;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const loadMore = async () => {
    if (loading || !hasMore || items.length === 0) return;
    setLoading(true);
    const lastItem = items[items.length - 1];
    const supabase = createClient();
    const { data } = await supabase.rpc("get_activity_feed", {
      p_user_id: userId,
      p_before: lastItem.event_at,
      p_limit: 20,
    });
    const newItems = (data || []) as FeedItem[];
    setItems((prev) => [...prev, ...newItems]);
    setHasMore(newItems.length === 20);
    setLoading(false);
  };

  return (
    <div>
      {items.map((item, i) => {
        const href = recipeLink(item);
        const sourceDisplay = item.source_name || (item.source_url ? new URL(item.source_url).hostname.replace(/^www\./, "") : null);

        return (
          <div
            key={`${item.event_type}-${item.recipe_id}-${item.event_at}-${i}`}
            className="group flex gap-2.5 py-2.5 border-t border-border items-center transition-all duration-150 cursor-pointer hover:bg-accent-light hover:-mx-1.5 hover:px-1.5"
          >
            {item.recipe_image_url ? (
              <Link href={href} className="shrink-0">
                <img
                  src={item.recipe_image_url}
                  alt={item.recipe_title}
                  className="w-[36px] h-[36px] object-cover shrink-0 transition-transform duration-[250ms] group-hover:scale-110"
                />
              </Link>
            ) : (
              <div className="w-[36px] h-[36px] bg-surface-alt shrink-0 flex items-center justify-center">
                <span className="font-display text-[14px] text-ink-muted">
                  {item.display_name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-light text-ink leading-[1.35]">
                <Link
                  href={`/profile/${item.user_id}`}
                  className="font-semibold hover:text-accent"
                >
                  {item.display_name}
                </Link>
                <span>{actionVerb(item.event_type)}</span>
                <Link href={href} className="font-display italic text-accent hover:underline">
                  {item.recipe_title}
                </Link>
              </p>
              {item.event_type === "cooked" && item.rating != null && (
                <StarRating rating={item.rating} />
              )}
              {item.event_type === "cooked" && sourceDisplay && (
                <span className="font-mono text-[10px] text-ink-muted">
                  via {sourceDisplay}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-ink-muted shrink-0">
              {formatTimeAgo(item.event_at)}
            </span>
          </div>
        );
      })}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-3 w-full border-t border-border py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted hover:text-accent transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
