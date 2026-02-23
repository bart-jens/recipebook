import Link from "next/link";
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

  if (!recipe) {
    const { data: card } = await supabase.rpc("get_recipe_card", {
      p_recipe_id: params.id,
    });

    if (card && card.visibility === "private") {
      return (
        <div className="px-5 pt-8 pb-24 max-w-xl">
          {card.image_url && (
            <img
              src={card.image_url}
              alt={card.title}
              className="w-full aspect-[4/3] object-cover mb-6"
            />
          )}

          <h1 className="text-[26px] font-normal tracking-[-0.01em] text-ink mb-1">{card.title}</h1>

          {card.source_name && (
            <p className="text-[13px] font-light text-ink-secondary mb-4">
              From{" "}
              {card.source_url ? (
                <a
                  href={card.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {card.source_name}
                </a>
              ) : (
                <span>{card.source_name}</span>
              )}
            </p>
          )}

          {(card.prep_time_minutes || card.cook_time_minutes || card.servings) && (
            <div className="flex gap-4 text-[11px] font-normal tracking-[0.02em] text-ink-muted mb-4">
              {(card.prep_time_minutes || card.cook_time_minutes) && (
                <span>{(card.prep_time_minutes || 0) + (card.cook_time_minutes || 0)} min</span>
              )}
              {card.servings && <span>{card.servings} servings</span>}
            </div>
          )}

          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {card.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-[11px] font-normal tracking-[0.02em] px-2 py-0.5 border border-border text-ink-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-5">
            <p className="text-[13px] font-light text-ink-secondary mb-1">
              This recipe is in{" "}
              {card.creator_display_name ? `${card.creator_display_name}'s` : "someone's"} private
              collection.
            </p>
            {card.source_url && (
              <a
                href={card.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-normal tracking-[0.02em] text-accent hover:underline"
              >
                View original recipe &rarr;
              </a>
            )}
          </div>

          <Link
            href="/recipes"
            className="mt-8 inline-block text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink transition-colors"
          >
            &larr; Back to recipes
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-5">
        <p className="text-[26px] font-normal tracking-[-0.01em] text-ink mb-2">Recipe not found</p>
        <Link
          href="/recipes"
          className="mt-6 text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to recipes
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
      photos={recipePhotos}
    />
  );
}
