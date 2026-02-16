"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface FeedItem {
  event_type: "cooked" | "published" | "forked";
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function actionVerb(type: string): string {
  switch (type) {
    case "cooked": return " cooked ";
    case "published": return " published ";
    case "forked": return " forked ";
    default: return " ";
  }
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
      <div className="divide-y divide-warm-border/40">
        {items.map((item, i) => (
          <div
            key={`${item.event_type}-${item.recipe_id}-${item.event_at}-${i}`}
            className="flex items-start gap-3 py-3 animate-fade-in-up"
            style={i < 10 ? { animationDelay: `${i * 30}ms`, animationFillMode: "backwards" } : undefined}
          >
            <Link href={`/profile/${item.user_id}`} className="shrink-0">
              {item.avatar_url ? (
                <img src={item.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-tag text-xs font-semibold text-warm-gray">
                  {item.display_name[0]?.toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <Link
                  href={`/profile/${item.user_id}`}
                  className="font-semibold hover:text-accent"
                >
                  {item.display_name}
                </Link>
                <span className="text-warm-gray">
                  {actionVerb(item.event_type)}
                </span>
                <Link
                  href={`/recipes/${item.recipe_id}`}
                  className="font-medium hover:text-accent"
                >
                  {item.recipe_title}
                </Link>
              </p>
              {item.notes && (
                <p className="mt-1 text-xs text-warm-gray italic">
                  &ldquo;{item.notes}&rdquo;
                </p>
              )}
              <span className="mt-1 block text-xs text-warm-gray">
                {formatTimeAgo(item.event_at)}
              </span>
            </div>
            {item.recipe_image_url && (
              <Link href={`/recipes/${item.recipe_id}`} className="shrink-0">
                <img
                  src={item.recipe_image_url}
                  alt={item.recipe_title}
                  className="h-12 w-12 rounded-md object-cover"
                />
              </Link>
            )}
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-4 w-full rounded-md border border-warm-border py-2 text-sm text-warm-gray transition-all hover:-translate-y-px hover:shadow-sm disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
