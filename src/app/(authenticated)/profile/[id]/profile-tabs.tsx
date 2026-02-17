"use client";

import { useState } from "react";
import Link from "next/link";
import { RecommendationCard } from "../../components/recommendation-card";
import { ForkDot } from "@/components/logo";

interface ActivityItem {
  recipe_id: string;
  recipe_title: string;
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
  { id: "activity", label: "Activity" },
  { id: "favorites", label: "Favorites" },
  { id: "published", label: "Published" },
  { id: "recommendations", label: "Recommendations" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
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
  const [activeTab, setActiveTab] = useState<TabId>("activity");

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-md bg-warm-tag p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-foreground shadow-sm"
                : "text-warm-gray hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "activity" && (
        <div>
          {activity.length === 0 ? (
            <EmptyTab message="No cooking activity yet" />
          ) : (
            <div className="space-y-3">
              {activity.map((item, i) => (
                <Link
                  key={`${item.recipe_id}-${item.cooked_at}-${i}`}
                  href={`/recipes/${item.recipe_id}`}
                  className="block rounded-md border border-warm-border bg-warm-tag p-4 transition-all hover:-translate-y-px hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{item.recipe_title}</p>
                    <span className="shrink-0 text-xs text-warm-gray">
                      {formatDate(item.cooked_at)}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="mt-1 text-sm text-warm-gray italic">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
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
            <div className="space-y-3">
              {favorites.map((item) => (
                <Link
                  key={item.recipe_id}
                  href={`/recipes/${item.recipe_id}`}
                  className="group flex items-center gap-3 rounded-md border border-warm-border bg-warm-tag p-3 transition-all hover:-translate-y-px hover:shadow-sm"
                >
                  {item.recipe_image_url ? (
                    <img
                      src={item.recipe_image_url}
                      alt={item.recipe_title}
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent/5">
                      <ForkDot size={16} color="rgba(45,95,93,0.2)" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.recipe_title}</p>
                    <p className="text-xs text-warm-gray">
                      Saved {formatDate(item.favorited_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "published" && (
        <div>
          {published.length === 0 ? (
            <EmptyTab message="No published recipes yet" />
          ) : (
            <div className="space-y-3">
              {published.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="block rounded-md border border-warm-border bg-warm-tag p-4 transition-all hover:-translate-y-px hover:shadow-sm"
                >
                  <h3 className="font-sans font-medium">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
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
            <div className="space-y-3">
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
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
      <ForkDot size={20} color="rgba(45,95,93,0.3)" />
      <p className="mt-3 text-sm text-warm-gray">{message}</p>
    </div>
  );
}
