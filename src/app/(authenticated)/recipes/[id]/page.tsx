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

  const [{ data: ingredients }, { data: tags }, { data: ratings }] =
    await Promise.all([
      supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipe.id)
        .order("order_index"),
      supabase
        .from("recipe_tags")
        .select("id, tag")
        .eq("recipe_id", recipe.id)
        .order("tag"),
      supabase
        .from("recipe_ratings")
        .select("id, rating, notes, cooked_date, created_at")
        .eq("recipe_id", recipe.id)
        .order("cooked_date", { ascending: false }),
    ]);

  return (
    <RecipeDetail
      recipe={recipe}
      ingredients={ingredients || []}
      tags={tags || []}
      ratings={ratings || []}
    />
  );
}
