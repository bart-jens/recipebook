"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ChefCard } from "./chef-card";
import { ForkDot } from "@/components/logo";

interface Chef {
  id: string;
  display_name: string;
  avatar_url: string | null;
  recipe_count: number;
  last_cooked: string | null;
  follow_state: "not_following" | "following";
}

export function ChefsTab() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChefs();
  }, []);

  async function loadChefs() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get who the user already follows
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = new Set((following || []).map((f) => f.following_id));

    // Get all profiles except self (includes last_cooked_at — accurate across all recipes)
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url, last_cooked_at")
      .neq("id", user.id)
      .eq("is_hidden", false)
      .order("display_name");

    if (!profiles || profiles.length === 0) {
      setChefs([]);
      setLoading(false);
      return;
    }

    const profileIds = profiles.map((p) => p.id);

    const { data: recipeCounts } = await supabase
      .from("recipes")
      .select("created_by")
      .eq("visibility", "public")
      .in("created_by", profileIds);

    const recipeCountMap = new Map<string, number>();
    for (const r of recipeCounts || []) {
      recipeCountMap.set(r.created_by, (recipeCountMap.get(r.created_by) || 0) + 1);
    }

    const enriched: Chef[] = profiles.map((p) => ({
      id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      recipe_count: recipeCountMap.get(p.id) || 0,
      last_cooked: (p as any).last_cooked_at || null,
      follow_state: followingIds.has(p.id) ? "following" : "not_following",
    }));

    // Sort: unfollowed first (discovery), then by last activity
    enriched.sort((a, b) => {
      if (a.follow_state !== b.follow_state) {
        return a.follow_state === "not_following" ? -1 : 1;
      }
      const aTime = a.last_cooked ? new Date(a.last_cooked).getTime() : 0;
      const bTime = b.last_cooked ? new Date(b.last_cooked).getTime() : 0;
      return bTime - aTime;
    });

    setChefs(enriched);
    setLoading(false);
  }

  function handleFollowChange(id: string, newState: "not_following" | "following") {
    setChefs((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, follow_state: newState } : c
      )
    );
  }

  const unfollowedChefs = chefs.filter((c) => c.follow_state === "not_following");
  const followedChefs = chefs.filter((c) => c.follow_state === "following");

  if (loading) {
    return (
      <div className="px-5 pt-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse border-b border-border"
          />
        ))}
      </div>
    );
  }

  if (chefs.length === 0) {
    return (
      <div className="mx-5 mt-4 border-t border-border py-8 text-center">
        <ForkDot size={24} color="rgba(139,69,19,0.2)" />
        <p className="mt-3 text-[13px] font-light text-ink-secondary">No chefs found yet.</p>
        <Link href="/invites" className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors mt-1 inline-block">
          Invite friends to join EefEats
        </Link>
      </div>
    );
  }

  if (unfollowedChefs.length === 0) {
    return (
      <div className="px-5">
        <div className="mt-4 border-t border-border py-8 text-center">
          <ForkDot size={24} color="rgba(139,69,19,0.2)" />
          <p className="mt-3 text-[14px] font-normal text-ink">You follow all chefs!</p>
          <Link href="/invites" className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors mt-1 inline-block">
            Invite more friends to join EefEats
          </Link>
        </div>
        {followedChefs.length > 0 && (
          <div className="mt-2">
            <h3 className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mb-2 pb-1.5 border-b border-border">Following</h3>
            {followedChefs.map((chef) => (
              <ChefCard
                key={chef.id}
                id={chef.id}
                displayName={chef.display_name}
                avatarUrl={chef.avatar_url}
                recipeCount={chef.recipe_count}
                lastCooked={chef.last_cooked}
                followState={chef.follow_state}
                onFollowChange={handleFollowChange}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      {unfollowedChefs.map((chef) => (
        <ChefCard
          key={chef.id}
          id={chef.id}
          displayName={chef.display_name}
          avatarUrl={chef.avatar_url}
          recipeCount={chef.recipe_count}
          lastCooked={chef.last_cooked}
          followState={chef.follow_state}
          onFollowChange={handleFollowChange}
        />
      ))}

      {followedChefs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mb-2 pb-1.5 border-b border-border">Following</h3>
          {followedChefs.map((chef) => (
            <ChefCard
              key={chef.id}
              id={chef.id}
              displayName={chef.display_name}
              avatarUrl={chef.avatar_url}
              recipeCount={chef.recipe_count}
              lastCooked={chef.last_cooked}
              followState={chef.follow_state}
              onFollowChange={handleFollowChange}
            />
          ))}
        </div>
      )}

      <Link
        href="/invites"
        className="block mt-6 py-5 border-t border-b border-border text-center transition-all hover:bg-accent-light hover:-mx-2 hover:px-2"
      >
        <p className="text-[20px] font-normal text-ink">
          Know someone who loves cooking?
        </p>
        <p className="text-[11px] font-normal tracking-[0.02em] text-accent mt-1">
          Invite them to join EefEats
        </p>
      </Link>
    </div>
  );
}
