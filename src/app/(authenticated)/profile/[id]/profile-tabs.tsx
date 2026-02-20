"use client";

import { useState } from "react";
import Link from "next/link";
import { ForkDot } from "@/components/logo";
import { RecommendationCard } from "../../components/recommendation-card";

interface ActivityItem {
  recipe_id: string;
  recipe_title: string;
  recipe_image_url?: string | null;
  cooked_at: string;
  notes: string | null;
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

interface RecommendationItem {
  share_id: string;
  title: string;
  source_url: string | null;
  source_name: string | null;
  source_type: string;
  image_url: string | null;
  tags: string[] | null;
  user_rating: number | null;
  share_notes: string | null;
  shared_at: string;
  recipe_id: string;
}

interface ProfileTabsProps {
  activity: ActivityItem[];
  favorites: FavoriteItem[];
  published: PublishedItem[];
  recommendations: RecommendationItem[];
  profileName: string;
  profileAvatarUrl: string | null;
  profileId: string;
}

const TABS = [
  { id: "recipes", label: "Recipes" },
  { id: "activity", label: "Activity" },
  { id: "favorites", label: "Favorites" },
  { id: "recommendations", label: "Recs" },
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

export function ProfileTabs({
  activity,
  favorites,
  published,
  recommendations,
  profileName,
  profileAvatarUrl,
  profileId,
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
            className={`font-mono text-[11px] uppercase tracking-[0.06em] py-2.5 pr-3.5 bg-transparent border-none cursor-pointer relative transition-colors ${
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
                      <div className="w-12 h-12 shrink-0 bg-surface-alt flex items-center justify-center">
                        <ForkDot size={16} color="rgba(139,69,19,0.15)" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[17px] leading-[1.2] tracking-[-0.01em] text-ink">
                        {recipe.title}
                      </div>
                      {recipe.description && (
                        <p className="text-[13px] font-light text-ink-secondary line-clamp-1 mt-0.5">
                          {recipe.description}
                        </p>
                      )}
                      <div className="font-mono text-[11px] text-ink-muted flex gap-2 mt-0.5">
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] px-1 py-0.5 border border-olive text-olive">
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
                {activity.map((item, i) => (
                  <Link
                    key={`${item.recipe_id}-${item.cooked_at}-${i}`}
                    href={`/recipes/${item.recipe_id}`}
                    className="group flex gap-2.5 py-2.5 border-b border-border items-center cursor-pointer transition-all duration-150 hover:bg-accent-light hover:-mx-1.5 hover:px-1.5"
                  >
                    {item.recipe_image_url ? (
                      <img
                        src={item.recipe_image_url}
                        alt={item.recipe_title}
                        className="w-9 h-9 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.1]"
                        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                      />
                    ) : (
                      <div className="w-9 h-9 shrink-0 bg-surface-alt flex items-center justify-center">
                        <ForkDot size={12} color="rgba(139,69,19,0.15)" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-light text-ink leading-[1.35]">
                        Cooked <span className="font-display italic text-accent">{item.recipe_title}</span>
                      </p>
                      {item.notes && (
                        <p className="text-[12px] font-light text-ink-muted italic mt-0.5 line-clamp-1">
                          &ldquo;{item.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-ink-muted shrink-0">
                      {formatDate(item.cooked_at)}
                    </span>
                  </Link>
                ))}
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
                      <div className="w-12 h-12 shrink-0 bg-surface-alt flex items-center justify-center">
                        <ForkDot size={16} color="rgba(139,69,19,0.15)" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[17px] leading-[1.2] tracking-[-0.01em] text-ink">
                        {item.recipe_title}
                      </div>
                      <div className="font-mono text-[11px] text-ink-muted mt-0.5">
                        Saved {formatDate(item.favorited_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "recommendations" && (
          <div>
            {recommendations.length === 0 ? (
              <EmptyTab message="No recommendations yet" />
            ) : (
              <div className="space-y-3 mt-3">
                {recommendations.map((card) => (
                  <RecommendationCard
                    key={card.share_id}
                    shareId={card.share_id}
                    title={card.title}
                    sourceUrl={card.source_url}
                    sourceName={card.source_name}
                    sourceType={card.source_type}
                    imageUrl={card.image_url}
                    tags={card.tags}
                    userRating={card.user_rating}
                    shareNotes={card.share_notes}
                    sharedAt={card.shared_at}
                    sharerName={profileName}
                    sharerAvatarUrl={profileAvatarUrl}
                    sharerId={profileId}
                    recipeId={card.recipe_id}
                  />
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
