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
    case "created": return " created ";
    case "saved": return " saved ";
    case "rated": return " rated ";
    default: return " ";
  }
}

function getDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? "text-amber-400" : "text-warm-border"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function recipeLink(item: FeedItem): string {
  if (item.event_type === "saved" && item.source_url) {
    return item.source_url;
  }
  return `/recipes/${item.recipe_id}`;
}

function isExternalLink(item: FeedItem): boolean {
  return item.event_type === "saved" && !!item.source_url;
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
        {items.map((item, i) => {
          const href = recipeLink(item);
          const external = isExternalLink(item);
          const domain = item.source_url ? getDomain(item.source_url) : null;

          return (
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
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-accent"
                    >
                      {item.recipe_title}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="font-medium hover:text-accent"
                    >
                      {item.recipe_title}
                    </Link>
                  )}
                </p>
                {item.event_type === "saved" && domain && (
                  <p className="mt-0.5 text-xs text-warm-gray">
                    from {domain}
                    {item.source_url && (
                      <>
                        {" "}
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-warm-accent hover:underline"
                        >
                          View source
                        </a>
                      </>
                    )}
                  </p>
                )}
                {item.event_type === "rated" && item.rating != null && (
                  <div className="mt-0.5">
                    <StarRating rating={item.rating} />
                  </div>
                )}
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
                external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={item.recipe_image_url}
                      alt={item.recipe_title}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  </a>
                ) : (
                  <Link href={href} className="shrink-0">
                    <img
                      src={item.recipe_image_url}
                      alt={item.recipe_title}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  </Link>
                )
              )}
            </div>
          );
        })}
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
