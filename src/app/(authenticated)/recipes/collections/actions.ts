"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getCollections() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, description, cover_image_url, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (!collections || collections.length === 0) return [];

  // Get recipe counts per collection
  const { data: memberships } = await supabase
    .from("collection_recipes")
    .select("collection_id, recipe_id")
    .in("collection_id", collections.map((c) => c.id));

  const countMap = new Map<string, number>();
  for (const m of memberships || []) {
    countMap.set(m.collection_id, (countMap.get(m.collection_id) || 0) + 1);
  }

  // Get cover images from first recipe in each collection that has an image
  const collectionsNeedingCover = collections.filter((c) => !c.cover_image_url);
  const coverMap = new Map<string, string>();
  if (collectionsNeedingCover.length > 0) {
    const { data: coverRecipes } = await supabase
      .from("collection_recipes")
      .select("collection_id, recipe_id, recipes(image_url)")
      .in("collection_id", collectionsNeedingCover.map((c) => c.id))
      .order("added_at", { ascending: true });

    for (const cr of (coverRecipes || []) as { collection_id: string; recipe_id: string; recipes: { image_url: string | null } | null }[]) {
      if (!coverMap.has(cr.collection_id) && cr.recipes?.image_url) {
        coverMap.set(cr.collection_id, cr.recipes.image_url);
      }
    }
  }

  return collections.map((c) => ({
    ...c,
    recipe_count: countMap.get(c.id) || 0,
    resolved_cover_url: c.cover_image_url || coverMap.get(c.id) || null,
  }));
}

export async function createCollection(name: string, description?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: user.id, name, description: description || null })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("Free plan limited")) {
      return { error: "Free plan limited to 5 collections. Upgrade to premium for unlimited collections." };
    }
    return { error: error.message };
  }

  revalidatePath("/recipes");
  return { id: data.id };
}

export async function renameCollection(collectionId: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", collectionId);

  if (error) return { error: error.message };
  revalidatePath("/recipes");
  return {};
}

export async function updateCollectionDescription(collectionId: string, description: string | null) {
  const supabase = createClient();
  const { error } = await supabase
    .from("collections")
    .update({ description })
    .eq("id", collectionId);

  if (error) return { error: error.message };
  revalidatePath("/recipes");
  return {};
}

export async function deleteCollection(collectionId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) return { error: error.message };
  revalidatePath("/recipes");
  return {};
}

export async function addRecipeToCollection(collectionId: string, recipeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("collection_recipes")
    .insert({ collection_id: collectionId, recipe_id: recipeId });

  if (error) {
    if (error.code === "23505") return {}; // Already exists, treat as success
    return { error: error.message };
  }
  revalidatePath("/recipes");
  return {};
}

export async function removeRecipeFromCollection(collectionId: string, recipeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("collection_recipes")
    .delete()
    .eq("collection_id", collectionId)
    .eq("recipe_id", recipeId);

  if (error) return { error: error.message };
  revalidatePath("/recipes");
  return {};
}

export async function getCollectionsForRecipe(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { collections: [], memberships: [] };

  const [{ data: collections }, { data: memberships }] = await Promise.all([
    supabase
      .from("collections")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("collection_recipes")
      .select("collection_id")
      .eq("recipe_id", recipeId),
  ]);

  const memberSet = new Set((memberships || []).map((m) => m.collection_id));

  return {
    collections: (collections || []).map((c) => ({
      ...c,
      contains_recipe: memberSet.has(c.id),
    })),
  };
}

export async function getUserPlan() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  return data?.plan || "free";
}
