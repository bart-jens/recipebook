import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  if (!recipe) {
    // Check if recipe exists but is private (RLS blocked it)
    const admin = createAdminClient();
    const { data: exists } = await admin
      .from("recipes")
      .select("id")
      .eq("id", params.id)
      .single();

    if (exists) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium">This recipe is private</p>
          <p className="mt-1 text-sm text-warm-gray">
            The owner hasn&apos;t made this recipe public yet.
          </p>
          <Link
            href="/recipes"
            className="mt-4 text-sm text-accent hover:underline"
          >
            Back to my recipes
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">Recipe not found</p>
        <Link
          href="/recipes"
          className="mt-4 text-sm text-accent hover:underline"
        >
          Back to my recipes
        </Link>
      </div>
    );
  }

  const [
    { data: ingredients },
    { data: tags },
    { data: ratings },
    { data: images },
    { data: cookEntries },
    { data: favoriteEntry },
    { data: savedEntry },
  ] = await Promise.all([
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
    user
      ? supabase
          .from("cook_log")
          .select("id, cooked_at, notes")
          .eq("recipe_id", recipe.id)
          .eq("user_id", user.id)
          .order("cooked_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("recipe_favorites")
          .select("id")
          .eq("recipe_id", recipe.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("saved_recipes")
          .select("id")
          .eq("recipe_id", recipe.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
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

  // Fetch share status for imported recipes
  let shareData: { isShared: boolean } = { isShared: false };
  if (isOwner) {
    const { data: share } = await supabase
      .from("recipe_shares")
      .select("id")
      .eq("user_id", user!.id)
      .eq("recipe_id", recipe.id)
      .maybeSingle();
    if (share) {
      shareData = { isShared: true };
    }
  }

  return (
    <RecipeDetail
      recipe={recipe}
      ingredients={ingredients || []}
      tags={tags || []}
      ratings={ratings || []}
      cookEntries={cookEntries || []}
      isFavorited={!!favoriteEntry}
      isSaved={!!savedEntry}
      isOwner={isOwner}
      creatorName={creatorName}
      creatorId={creatorId}
      isShared={shareData.isShared}
      photos={recipePhotos}
    />
  );
}
