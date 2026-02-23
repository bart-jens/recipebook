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
    const { data: cardRows } = await supabase.rpc("get_recipe_card", {
      p_recipe_id: params.id,
    });
    const card = cardRows?.[0] ?? null;

    if (card && card.visibility === "private") {
      const formatTime = (min: number) =>
        min < 60 ? `${min}m` : `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}m` : ""}`;

      return (
        <div className="-mx-5">
          {/* Nav */}
          <nav className="sticky top-0 z-50 flex items-center px-5 py-3 backdrop-blur-[20px] bg-[rgba(246,244,239,0.92)]">
            <Link
              href="/recipes"
              className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </Link>
          </nav>

          {/* Hero image */}
          {card.image_url && (
            <div className="overflow-hidden h-[220px]">
              <img
                src={card.image_url}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div className={`px-5 ${card.image_url ? "-mt-4" : "pt-4"}`}>
            {card.tags && card.tags.length > 0 && (
              <div className="text-[11px] font-normal tracking-[0.02em] text-accent mb-1.5">
                {card.tags[0]}
              </div>
            )}
            <h1 className="text-[36px] font-light tracking-[-0.03em] leading-[1.1] text-ink mb-2.5">
              {card.title}
            </h1>

            {card.source_name && (
              <div className="text-[12px] text-ink-muted mb-3">
                {card.source_url ? (
                  <a
                    href={card.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    from {card.source_name}
                  </a>
                ) : (
                  <span>from {card.source_name}</span>
                )}
              </div>
            )}

            {(card.creator_display_name || card.creator_avatar_url) && (
              <div className="flex items-center gap-2 mb-4">
                {card.creator_avatar_url ? (
                  <img
                    src={card.creator_avatar_url}
                    alt={card.creator_display_name ?? ""}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-[11px] font-normal text-ink-muted">
                    {card.creator_display_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-[13px] font-light text-ink-secondary">
                  {card.creator_display_name}
                </span>
              </div>
            )}
          </div>

          {/* Stats bar */}
          {(card.prep_time_minutes || card.cook_time_minutes || card.servings) && (
            <div className="mx-5 border-t-[3px] border-t-ink border-b border-b-ink flex mb-4">
              {card.prep_time_minutes && (
                <div className="flex-1 py-2.5 px-3 text-center border-r border-border">
                  <div className="text-[20px] font-normal text-ink">{formatTime(card.prep_time_minutes)}</div>
                  <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Prep</div>
                </div>
              )}
              {card.cook_time_minutes && (
                <div className="flex-1 py-2.5 px-3 text-center border-r border-border">
                  <div className="text-[20px] font-normal text-ink">{formatTime(card.cook_time_minutes)}</div>
                  <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Cook</div>
                </div>
              )}
              {card.servings && (
                <div className="flex-1 py-2.5 px-3 text-center">
                  <div className="text-[20px] font-normal text-ink">{card.servings}</div>
                  <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Serves</div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {card.tags && card.tags.length > 1 && (
            <div className="px-5 flex flex-wrap gap-1.5 mb-6">
              {card.tags.slice(1).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[11px] font-normal tracking-[0.02em] px-2 py-0.5 border border-border text-ink-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Private notice + actions */}
          <div className="px-5 border-t border-border pt-5 pb-24">
            <p className="text-[13px] font-light text-ink-secondary mb-4">
              In {card.creator_display_name ? `${card.creator_display_name}'s` : "someone's"} private collection.
            </p>
            {card.source_url && (
              <>
                <a
                  href={card.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] font-normal tracking-[0.02em] text-accent hover:underline mb-4"
                >
                  View original recipe &rarr;
                </a>
                <Link
                  href={`/recipes/import-url?url=${encodeURIComponent(card.source_url)}`}
                  className="block text-center text-[11px] font-normal tracking-[0.02em] bg-ink text-white px-4 py-2.5 hover:bg-ink/90 transition-colors"
                >
                  Save to my recipes
                </Link>
              </>
            )}
          </div>
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
