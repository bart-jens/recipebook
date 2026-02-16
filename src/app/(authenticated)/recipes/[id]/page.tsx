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

  const [{ data: ingredients }, { data: tags }, { data: ratings }, { data: images }] =
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
      supabase
        .from("recipe_images")
        .select("id, storage_path, image_type")
        .eq("recipe_id", recipe.id)
        .order("created_at"),
    ]);

  // Build photo list: user uploads first, then source images
  const recipePhotos = (images || [])
    .sort((a, b) => {
      if (a.image_type === "user_upload" && b.image_type !== "user_upload") return -1;
      if (a.image_type !== "user_upload" && b.image_type === "user_upload") return 1;
      return 0;
    })
    .map((img) => ({
      id: img.id,
      url: supabase.storage.from("recipe-images").getPublicUrl(img.storage_path).data.publicUrl,
      imageType: img.image_type,
    }));

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

  // Fetch publish count, user plan, and share status
  let publishCount = 0;
  let userPlan = "free";
  let shareData: { isShared: boolean; notes: string | null } = { isShared: false, notes: null };
  if (isOwner) {
    const [{ data: profile }, { count }, { data: share }] = await Promise.all([
      supabase.from("user_profiles").select("plan").eq("id", user!.id).single(),
      supabase.from("recipes").select("id", { count: "exact", head: true }).eq("created_by", user!.id).eq("visibility", "public"),
      supabase.from("recipe_shares").select("notes").eq("user_id", user!.id).eq("recipe_id", recipe.id).maybeSingle(),
    ]);
    userPlan = profile?.plan || "free";
    publishCount = count || 0;
    if (share) {
      shareData = { isShared: true, notes: share.notes };
    }
  }

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
      publishCount={publishCount}
      userPlan={userPlan}
      isShared={shareData.isShared}
      shareNotes={shareData.notes}
      photos={recipePhotos}
    />
  );
}
