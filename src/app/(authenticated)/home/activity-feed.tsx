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
  recipe_visibility: string | null;
  recipe_source_type: string | null;
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

type LinkTarget =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' };

function resolveLink(item: FeedItem): LinkTarget {
  if (item.recipe_visibility === 'public') {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', href: item.source_url };
  }
  // Fall back to recipe page — private recipe pages show a metadata card gracefully
  return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore || items.length === 0) return;
    setLoading(true);
    setLoadError(null);
    const lastItem = items[items.length - 1];
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("get_activity_feed", {
        p_user_id: userId,
        p_before: lastItem.event_at,
        p_limit: 20,
      });
      if (error) throw error;
      const newItems = (data || []) as FeedItem[];
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= 20);
    } catch {
      setLoadError("Couldn't load more. Tap to retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {items.map((item, i) => {
        const link = resolveLink(item);
        const sourceDisplay = item.source_name
          || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return item.source_url; } })() : null)
          || (item.recipe_visibility === 'private' && item.recipe_source_type !== 'manual' && item.recipe_source_type !== 'fork' ? 'a cookbook' : null);

        return (
          <div
            key={`${item.event_type}-${item.recipe_id}-${item.event_at}-${i}`}
            className="group flex gap-2.5 py-2.5 border-t border-border items-center transition-all duration-150 cursor-pointer hover:bg-accent-light hover:-mx-1.5 hover:px-1.5"
          >
            <Link href={`/profile/${item.user_id}`} className="shrink-0">
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  alt={item.display_name}
                  className="w-[36px] h-[36px] rounded-full object-cover shrink-0 transition-transform duration-[250ms] group-hover:scale-110"
                />
              ) : (
                <div className="w-[36px] h-[36px] rounded-full bg-surface-alt shrink-0 flex items-center justify-center">
                  <span className="text-[14px] font-normal text-ink-muted">
                    {(item.display_name?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-light text-ink leading-[1.35]">
                <Link
                  href={`/profile/${item.user_id}`}
                  className="font-normal hover:text-accent"
                >
                  {item.display_name}
                </Link>
                <span>{actionVerb(item.event_type)}</span>
                {link.kind === 'internal' ? (
                  <Link href={link.href} className="font-normal text-accent hover:underline">
                    {item.recipe_title}
                  </Link>
                ) : link.kind === 'external' ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-normal text-accent hover:underline">
                    {item.recipe_title}
                  </a>
                ) : (
                  <span className="font-normal text-accent">{item.recipe_title}</span>
                )}
              </p>
              {item.event_type === "cooked" && item.rating != null && (
                <StarRating rating={item.rating} />
              )}
              {sourceDisplay && (
                <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                  {item.source_url && link.kind === 'external'
                    ? `via ${sourceDisplay}`
                    : `from ${sourceDisplay}`}
                </span>
              )}
            </div>
            <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted shrink-0">
              {formatTimeAgo(item.event_at)}
            </span>
          </div>
        );
      })}
      {hasMore && (
        <div>
          {loadError && (
            <p className="text-[12px] font-light text-red-500 text-center pt-2">{loadError}</p>
          )}
          <button
            onClick={loadMore}
            disabled={loading}
            className="mt-1 w-full border-t border-border py-2.5 text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-accent transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
