"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateRecipe(recipeId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const instructions = (formData.get("instructions") as string) || null;
  const prepTime = formData.get("prep_time_minutes") as string;
  const cookTime = formData.get("cook_time_minutes") as string;
  const servings = formData.get("servings") as string;
  const ingredientsJson = formData.get("ingredients") as string;
  const sourceName = formData.has("source_name")
    ? (formData.get("source_name") as string) || null
    : undefined;

  const updateData: Record<string, unknown> = {
    title,
    description,
    instructions,
    prep_time_minutes: prepTime ? parseInt(prepTime) : null,
    cook_time_minutes: cookTime ? parseInt(cookTime) : null,
    servings: servings ? parseInt(servings) : null,
  };
  if (sourceName !== undefined) {
    updateData.source_name = sourceName;
  }

  const { error } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", recipeId);

  if (error) return { error: error.message };

  // Replace all ingredients: delete existing, insert new
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);

  const ingredients = JSON.parse(ingredientsJson || "[]");
  const rows = ingredients
    .filter((ing: { ingredient_name: string }) => ing.ingredient_name.trim())
    .map((ing: { quantity: string; unit: string; ingredient_name: string; notes: string }, i: number) => ({
      recipe_id: recipeId,
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity ? parseFloat(ing.quantity) : null,
      unit: ing.unit || null,
      notes: ing.notes || null,
      order_index: i,
    }));

  if (rows.length > 0) {
    const { error: ingError } = await supabase.from("recipe_ingredients").insert(rows);
    if (ingError) return { error: ingError.message };
  }

  redirect(`/recipes/${recipeId}`);
}

export async function deleteRecipe(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  if (error) return { error: error.message };
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function addTag(recipeId: string, tag: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("recipe_tags")
    .insert({ recipe_id: recipeId, tag });
  if (error && !error.message.includes("duplicate")) {
    return { error: error.message };
  }
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function removeTag(tagId: string) {
  const supabase = createClient();
  const { data: tag } = await supabase
    .from("recipe_tags")
    .select("recipe_id")
    .eq("id", tagId)
    .single();
  const { error } = await supabase.from("recipe_tags").delete().eq("id", tagId);
  if (error) return { error: error.message };
  if (tag) {
    revalidatePath(`/recipes/${tag.recipe_id}`);
    revalidatePath("/recipes");
  }
}

export async function toggleFavorite(recipeId: string, shouldFavorite: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (shouldFavorite) {
    const { error } = await supabase.from("recipe_favorites").insert({
      user_id: user.id,
      recipe_id: recipeId,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("recipe_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);
    if (error) return { error: error.message };
  }
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function logCook(recipeId: string, cookedAt: string, notes: string | null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("cook_log").insert({
    user_id: user.id,
    recipe_id: recipeId,
    cooked_at: cookedAt,
    notes,
  });
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function deleteCookEntry(cookId: string) {
  const supabase = createClient();
  const { data: entry } = await supabase
    .from("cook_log")
    .select("recipe_id")
    .eq("id", cookId)
    .single();
  const { error } = await supabase.from("cook_log").delete().eq("id", cookId);
  if (error) return { error: error.message };
  if (entry) {
    revalidatePath(`/recipes/${entry.recipe_id}`);
    revalidatePath("/recipes");
  }
}

export async function saveRecipe(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("saved_recipes").insert({
    user_id: user.id,
    recipe_id: recipeId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function unsaveRecipe(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("saved_recipes")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId);
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function addRating(
  recipeId: string,
  rating: number,
  notes: string | null,
  cookedDate: string | null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("recipe_ratings").insert({
    recipe_id: recipeId,
    user_id: user.id,
    rating,
    notes,
    cooked_date: cookedDate,
  });
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function toggleVisibility(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: recipe } = await supabase
    .from("recipes")
    .select("visibility")
    .eq("id", recipeId)
    .eq("created_by", user.id)
    .single();

  if (!recipe) return { error: "Recipe not found" };

  const newVisibility = recipe.visibility === "public" ? "private" : "public";
  const updates: Record<string, unknown> = { visibility: newVisibility };
  if (newVisibility === "public") {
    updates.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("recipes").update(updates).eq("id", recipeId);
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  revalidatePath("/discover");
}

export async function deleteRating(ratingId: string) {
  const supabase = createClient();
  const { data: rating } = await supabase
    .from("recipe_ratings")
    .select("recipe_id")
    .eq("id", ratingId)
    .single();
  const { error } = await supabase.from("recipe_ratings").delete().eq("id", ratingId);
  if (error) return { error: error.message };
  if (rating) {
    revalidatePath(`/recipes/${rating.recipe_id}`);
    revalidatePath("/recipes");
  }
}
