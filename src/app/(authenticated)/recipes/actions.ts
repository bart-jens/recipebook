"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rehostImage } from "@/lib/rehost-image";

export async function createRecipe(formData: FormData) {
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
  const externalImageUrl = (formData.get("image_url") as string) || null;

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      title,
      description,
      instructions,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      source_type: (formData.get("source_type") as string) || "manual",
      source_url: (formData.get("source_url") as string) || null,
      image_url: externalImageUrl,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const ingredients = JSON.parse(ingredientsJson || "[]");
  if (ingredients.length > 0) {
    const rows = ingredients
      .filter((ing: { ingredient_name: string }) => ing.ingredient_name.trim())
      .map((ing: { quantity: string; unit: string; ingredient_name: string; notes: string }, i: number) => ({
        recipe_id: recipe.id,
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
  }

  // Rehost external image to our own storage (non-blocking for redirect)
  if (externalImageUrl) {
    try {
      const rehostedUrl = await rehostImage(externalImageUrl, user.id, recipe.id);
      await supabase
        .from("recipes")
        .update({ image_url: rehostedUrl })
        .eq("id", recipe.id);
    } catch (e) {
      // Keep external URL as fallback — don't fail the recipe save
      console.error("Image rehost failed:", e);
    }
  }

  redirect(`/recipes/${recipe.id}`);
}
