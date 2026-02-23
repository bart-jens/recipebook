import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RecipeCardPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Query recipe directly (non-copyrightable fields only — no description, instructions, ingredients)
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, title, image_url, source_name, source_url, source_type, visibility, prep_time_minutes, cook_time_minutes, servings, created_by, recipe_tags(tag)")
    .eq("id", params.id)
    .single();

  if (!recipe) {
    return (
      <div className="px-5 py-12 text-center">
        <h1 className="text-[26px] font-normal text-ink">Recipe not found</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  // Fetch creator profile
  const { data: creator } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", recipe.created_by)
    .single();

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const sourceDisplay = recipe.source_name
    || (recipe.source_url
      ? (() => { try { return new URL(recipe.source_url).hostname.replace(/^www\./, ""); } catch { return recipe.source_url; } })()
      : null);

  const tags = (recipe.recipe_tags || []).map((t: { tag: string }) => t.tag);

  return (
    <div className="px-5 py-4 pb-24">
      <div className="mb-6">
        <Link href="/" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back
        </Link>
      </div>

      <div className="max-w-2xl">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="mb-6 w-full max-h-[400px] object-cover"
          />
        )}

        <h1 className="text-[26px] font-normal leading-tight text-ink">
          {recipe.title}
        </h1>

        {sourceDisplay && (
          <p className="mt-2 text-sm text-warm-gray">
            From{" "}
            {recipe.source_url ? (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {sourceDisplay}
              </a>
            ) : (
              <span className="font-medium text-ink">{sourceDisplay}</span>
            )}
          </p>
        )}

        {/* Creator */}
        {creator && (
          <div className="mt-4 flex items-center gap-2">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt">
                <span className="text-xs text-ink-muted">
                  {creator.display_name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-ink-secondary">
              {creator.display_name}
            </span>
          </div>
        )}

        {/* Meta row */}
        {(recipe.prep_time_minutes || recipe.cook_time_minutes || recipe.servings) && (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-warm-border pt-4">
            {recipe.prep_time_minutes && (
              <div>
                <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Prep</span>
                <p className="text-sm text-ink">{formatTime(recipe.prep_time_minutes)}</p>
              </div>
            )}
            {recipe.cook_time_minutes && (
              <div>
                <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Cook</span>
                <p className="text-sm text-ink">{formatTime(recipe.cook_time_minutes)}</p>
              </div>
            )}
            {recipe.servings && (
              <div>
                <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Servings</span>
                <p className="text-sm text-ink">{recipe.servings}</p>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-warm-tag px-2.5 py-1 text-[11px] font-normal tracking-[0.02em] text-ink-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Note about private recipe */}
        <div className="mt-8 border-t border-warm-border pt-4">
          <p className="text-xs text-ink-muted">
            This is a private recipe. Only the title, source, and basic details are shown.
          </p>
        </div>
      </div>
    </div>
  );
}
