"use server";

import { redirect } from "next/navigation";
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
