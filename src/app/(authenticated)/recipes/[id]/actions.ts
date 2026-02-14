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

  const { error } = await supabase
    .from("recipes")
    .update({
      title,
      description,
      instructions,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
    })
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
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  if (error) return { error: error.message };
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

export async function toggleFavorite(recipeId: string, isFavorite: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("recipes")
    .update({ is_favorite: isFavorite })
    .eq("id", recipeId);
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

export async function publishRecipe(recipeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("recipes")
    .update({ visibility: "public", published_at: new Date().toISOString() })
    .eq("id", recipeId);
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  revalidatePath("/discover");
}

export async function unpublishRecipe(recipeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("recipes")
    .update({ visibility: "private", published_at: null })
    .eq("id", recipeId);
  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  revalidatePath("/discover");
}

export async function forkRecipe(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch original recipe + ingredients
  const { data: original } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .single();
  if (!original) return { error: "Recipe not found" };

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("order_index");

  const { data: tags } = await supabase
    .from("recipe_tags")
    .select("tag")
    .eq("recipe_id", recipeId);

  // Create forked copy
  const { data: fork, error } = await supabase
    .from("recipes")
    .insert({
      title: original.title,
      description: original.description,
      instructions: original.instructions,
      prep_time_minutes: original.prep_time_minutes,
      cook_time_minutes: original.cook_time_minutes,
      servings: original.servings,
      source_url: original.source_url,
      source_type: original.source_type,
      created_by: user.id,
      forked_from_id: recipeId,
      visibility: "private",
    })
    .select("id")
    .single();

  if (error || !fork) return { error: error?.message || "Failed to fork" };

  // Copy ingredients
  if (ingredients && ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing) => ({
        recipe_id: fork.id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
        order_index: ing.order_index,
      }))
    );
  }

  // Copy tags
  if (tags && tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      tags.map((t) => ({
        recipe_id: fork.id,
        tag: t.tag,
      }))
    );
  }

  redirect(`/recipes/${fork.id}`);
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
