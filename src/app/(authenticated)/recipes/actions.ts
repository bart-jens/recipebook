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

  const imageBase64 = (formData.get("image_base64") as string) || null;
  const sourceName = (formData.get("source_name") as string) || null;
  const language = (formData.get("language") as string) || null;
  const sourceType = (formData.get("source_type") as string) || "manual";

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      title,
      description,
      instructions,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      source_type: sourceType,
      source_url: (formData.get("source_url") as string) || null,
      source_name: sourceName,
      language,
      image_url: externalImageUrl,
      created_by: user.id,
      visibility: sourceType === "manual" ? "public" : "private",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Save tags
  const tagsJson = formData.get("tags") as string;
  const tags: string[] = JSON.parse(tagsJson || "[]");
  if (tags.length > 0) {
    const tagRows = tags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t)
      .map((t) => ({ recipe_id: recipe.id, tag: t }));
    if (tagRows.length > 0) {
      await supabase.from("recipe_tags").insert(tagRows);
    }
  }

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

  // Upload user-provided image (from create form)
  if (imageBase64) {
    const buffer = Buffer.from(imageBase64, "base64");
    const storagePath = `${user.id}/${recipe.id}/${crypto.randomUUID()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(storagePath, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
    } else {
      const { data: urlData } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(storagePath);

      const { error: updateError } = await supabase
        .from("recipes")
        .update({ image_url: urlData.publicUrl })
        .eq("id", recipe.id);

      if (updateError) {
        console.error("Failed to update recipe image_url:", updateError);
      }

      const { error: insertError } = await supabase.from("recipe_images").insert({
        recipe_id: recipe.id,
        storage_path: storagePath,
        is_primary: true,
        image_type: "user_upload",
      });

      if (insertError) {
        console.error("Failed to insert recipe_images row:", insertError);
      }
    }
  }

  // Rehost external image to our own storage (non-blocking for redirect)
  if (externalImageUrl && !imageBase64) {
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

  // Auto-share imported recipes (creates recommendation card for followers)
  if (sourceType !== "manual") {
    await supabase.from("recipe_shares").insert({
      user_id: user.id,
      recipe_id: recipe.id,
    });
  }

  redirect(`/recipes/${recipe.id}`);
}
