import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImageUpload } from "./image-upload";
import { EditRecipeClient } from "./edit-recipe-client";
import { updateRecipe } from "../actions";

export default async function EditRecipePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!recipe) notFound();

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", recipe.id)
    .order("order_index");

  const initialData = {
    title: recipe.title,
    description: recipe.description || "",
    instructions: recipe.instructions || "",
    prep_time_minutes: recipe.prep_time_minutes?.toString() || "",
    cook_time_minutes: recipe.cook_time_minutes?.toString() || "",
    servings: recipe.servings?.toString() || "",
    ingredients: (ingredients || []).map((ing) => ({
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity?.toString() || "",
      unit: ing.unit || "",
      notes: ing.notes || "",
    })),
  };

  async function action(formData: FormData) {
    "use server";
    return updateRecipe(params.id, formData);
  }

  return (
    <div className="px-5 py-4 pb-24">
      <div className="mb-8">
        <Link href={`/recipes/${recipe.id}`} className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipe
        </Link>
        <h1 className="mt-2 text-2xl font-normal">Edit Recipe</h1>
      </div>
      <ImageUpload recipeId={recipe.id} currentImageUrl={recipe.image_url} />
      <EditRecipeClient initialData={initialData} initialSourceName={recipe.source_name} action={action} />
    </div>
  );
}
