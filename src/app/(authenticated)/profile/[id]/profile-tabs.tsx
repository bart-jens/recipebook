"use client";

import { useState } from "react";
import Link from "next/link";
import { ForkDot } from "@/components/logo";
import { RecipePlaceholder } from "@/lib/recipe-placeholder";

interface ActivityItem {
  recipe_id: string;
  recipe_title: string;
  recipe_image_url?: string | null;
  cooked_at: string;
  notes: string | null;
  source_url?: string | null;
  source_name?: string | null;
  source_type?: string | null;
  recipe_visibility?: string | null;
}

interface FavoriteItem {
  recipe_id: string;
  recipe_title: string;
  recipe_image_url: string | null;
  favorited_at: string;
}

interface PublishedItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  published_at: string;
}

interface ProfileTabsProps {
  activity: ActivityItem[];
  favorites: FavoriteItem[];
  published: PublishedItem[];
}

const TABS = [
  { id: "recipes", label: "Recipes" },
  { id: "activity", label: "Activity" },
  { id: "favorites", label: "Favorites" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ActivityLinkTarget =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' };

function resolveActivityLink(item: ActivityItem): ActivityLinkTarget {
  if (item.recipe_visibility === 'public' || !item.recipe_visibility) {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', href: item.source_url };
  }
  if (item.source_type === 'manual' || item.source_type === 'fork') {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  return { kind: 'none' };
}

export function ProfileTabs({
  activity,
  favorites,
  published,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("recipes");

  return (
    <div>
      {/* Nav Tabs */}
      <div className="flex px-5 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[11px] font-normal tracking-[0.02em] py-2.5 pr-3.5 bg-transparent border-none cursor-pointer relative transition-colors ${
              activeTab === tab.id
                ? "text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-[-1px] left-0 right-3.5 h-0.5 bg-ink" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 pb-12">
        {activeTab === "recipes" && (
          <div>
            {published.length === 0 ? (
              <EmptyTab message="No published recipes yet" />
            ) : (
              <div>
                {published.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="group flex gap-3 py-3 border-b border-border items-center cursor-pointer transition-all duration-150 hover:pl-1"
                  >
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-12 h-12 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.08]"
                        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                      />
                    ) : (
                      <RecipePlaceholder id={recipe.id} size={48} className="shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[20px] font-normal leading-[1.2] text-ink">
                        {recipe.title}
                      </div>
                      {recipe.description && (
                        <p className="text-[13px] font-light text-ink-secondary line-clamp-1 mt-0.5">
                          {recipe.description}
                        </p>
                      )}
                      <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted flex gap-2 mt-0.5">
                        <span className="text-[11px] font-normal tracking-[0.02em] px-1 py-0.5 border border-olive text-olive">
                          Published
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            {activity.length === 0 ? (
              <EmptyTab message="No cooking activity yet" />
            ) : (
              <div>
                {activity.map((item, i) => {
                  const link = resolveActivityLink(item);
                  const sourceLabel = item.source_name
                    || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return null; } })() : null)
                    || (item.recipe_visibility === 'private' && item.source_type !== 'manual' && item.source_type !== 'fork' ? 'a cookbook' : null);

                  const className = "group flex gap-2.5 py-2.5 border-b border-border items-center transition-all duration-150 hover:bg-accent-light hover:-mx-1.5 hover:px-1.5";

                  const inner = (
                    <>
                      {item.recipe_image_url ? (
                        <img
                          src={item.recipe_image_url}
                          alt={item.recipe_title}
                          className="w-9 h-9 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.1]"
                          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                        />
                      ) : (
                        <RecipePlaceholder id={item.recipe_id} size={36} className="shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-light text-ink leading-[1.35]">
                          Cooked <span className="font-normal text-accent">{item.recipe_title}</span>
                        </p>
                        {sourceLabel && (
                          <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                            {item.source_url && link.kind === 'external' ? `via ${sourceLabel}` : `from ${sourceLabel}`}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[12px] font-light text-ink-muted italic mt-0.5 line-clamp-1">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted shrink-0">
                        {formatDate(item.cooked_at)}
                      </span>
                    </>
                  );

                  return link.kind === 'internal' ? (
                    <Link key={`${item.recipe_id}-${item.cooked_at}-${i}`} href={link.href} className={className}>
                      {inner}
                    </Link>
                  ) : link.kind === 'external' ? (
                    <a key={`${item.recipe_id}-${item.cooked_at}-${i}`} href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
                      {inner}
                    </a>
                  ) : (
                    <div key={`${item.recipe_id}-${item.cooked_at}-${i}`} className={className}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div>
            {favorites.length === 0 ? (
              <EmptyTab message="No favorite recipes yet" />
            ) : (
              <div>
                {favorites.map((item) => (
                  <Link
                    key={item.recipe_id}
                    href={`/recipes/${item.recipe_id}`}
                    className="group flex gap-3 py-3 border-b border-border items-center cursor-pointer transition-all duration-150 hover:pl-1"
                  >
                    {item.recipe_image_url ? (
                      <img
                        src={item.recipe_image_url}
                        alt={item.recipe_title}
                        className="w-12 h-12 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.08]"
                        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                      />
                    ) : (
                      <RecipePlaceholder id={item.recipe_id} size={48} className="shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-light text-ink">
                        {item.recipe_title}
                      </div>
                      <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mt-0.5">
                        Saved {formatDate(item.favorited_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center border-t border-border py-10">
      <ForkDot size={24} color="rgba(139,69,19,0.2)" />
      <p className="mt-3 text-[13px] font-light text-ink-secondary">{message}</p>
    </div>
  );
}
