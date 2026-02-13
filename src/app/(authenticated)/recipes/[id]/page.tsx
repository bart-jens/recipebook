import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecipeDetail } from "./recipe-detail";

export default async function RecipeDetailPage({
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

  return (
    <RecipeDetail
      recipe={recipe}
      ingredients={ingredients || []}
    />
  );
}
