import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecipeDetail } from "./recipe-detail";

export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Fetch fork source info if this is a fork
  let forkedFrom: { id: string; title: string; creator_name: string } | null = null;
  if (recipe.forked_from_id) {
    const { data: original } = await supabase
      .from("recipes")
      .select("id, title, created_by")
      .eq("id", recipe.forked_from_id)
      .single();
    if (original) {
      const { data: creator } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", original.created_by)
        .single();
      forkedFrom = {
        id: original.id,
        title: original.title,
        creator_name: creator?.display_name || "Unknown",
      };
    }
  }

  // Fetch creator info for public recipes
  let creatorName: string | null = null;
  let creatorId: string | null = null;
  if (recipe.visibility === "public" && recipe.created_by !== user?.id) {
    const { data: creator } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", recipe.created_by)
      .single();
    creatorName = creator?.display_name || null;
    creatorId = recipe.created_by;
  }

  const isOwner = user?.id === recipe.created_by;

  return (
    <RecipeDetail
      recipe={recipe}
      ingredients={ingredients || []}
      tags={tags || []}
      ratings={ratings || []}
      isOwner={isOwner}
      forkedFrom={forkedFrom}
      creatorName={creatorName}
      creatorId={creatorId}
    />
  );
}
