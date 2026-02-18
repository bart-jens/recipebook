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

    // Get all profiles except self
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .neq("id", user.id)
      .order("display_name");

    if (!profiles || profiles.length === 0) {
      setChefs([]);
      setLoading(false);
      return;
    }

    const profileIds = profiles.map((p) => p.id);

    // Batch fetch recipe counts and last cooked
    const [{ data: recipeCounts }, { data: cookLogs }] = await Promise.all([
      supabase
        .from("recipes")
        .select("created_by")
        .eq("visibility", "public")
        .in("created_by", profileIds),
      supabase
        .from("cook_log")
        .select("user_id, cooked_at")
        .in("user_id", profileIds)
        .order("cooked_at", { ascending: false }),
    ]);

    const recipeCountMap = new Map<string, number>();
    for (const r of recipeCounts || []) {
      recipeCountMap.set(r.created_by, (recipeCountMap.get(r.created_by) || 0) + 1);
    }

    const lastCookedMap = new Map<string, string>();
    for (const c of cookLogs || []) {
      if (!lastCookedMap.has(c.user_id)) {
        lastCookedMap.set(c.user_id, c.cooked_at);
      }
    }

    const enriched: Chef[] = profiles.map((p) => ({
      id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      recipe_count: recipeCountMap.get(p.id) || 0,
      last_cooked: lastCookedMap.get(p.id) || null,
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
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-md bg-warm-tag"
          />
        ))}
      </div>
    );
  }

  if (chefs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
        <ForkDot size={24} color="rgba(45,95,93,0.3)" />
        <p className="mt-3 text-warm-gray">No Chefs found yet.</p>
        <Link href="/invites" className="mt-1 text-sm text-accent hover:underline">
          Invite friends to join EefEats!
        </Link>
      </div>
    );
  }

  if (unfollowedChefs.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center rounded-md border border-accent/20 bg-accent/5 p-8">
          <ForkDot size={24} color="rgba(45,95,93,0.3)" />
          <p className="mt-3 font-medium">You follow all Chefs!</p>
          <Link href="/invites" className="mt-1 text-sm text-accent hover:underline">
            Invite more friends to join EefEats
          </Link>
        </div>
        {followedChefs.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-warm-gray">Following</h3>
            <div className="space-y-3">
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
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
      </div>

      {followedChefs.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-warm-gray">Following</h3>
          <div className="space-y-3">
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
        </div>
      )}

      <Link href="/invites" className="mt-6 flex flex-col items-center rounded-md border border-warm-border bg-warm-tag p-6 transition-all hover:-translate-y-px hover:shadow-sm">
        <p className="font-medium">Know someone who loves cooking?</p>
        <p className="mt-1 text-sm text-accent">
          Invite them to join EefEats
        </p>
      </Link>
    </div>
  );
}
