import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatQuantity } from "@/lib/unit-conversion";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eefeats.com";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("title, description, image_url")
    .eq("id", params.id)
    .eq("visibility", "public")
    .single();

  if (!recipe) {
    return { title: "Recipe not found | EefEats" };
  }

  const title = `${recipe.title} | EefEats`;
  const description = recipe.description || `Check out ${recipe.title} on EefEats`;

  return {
    title,
    description,
    openGraph: {
      title: recipe.title,
      description,
      url: `${APP_URL}/r/${params.id}`,
      siteName: "EefEats",
      type: "article",
      ...(recipe.image_url && {
        images: [{ url: recipe.image_url, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: recipe.image_url ? "summary_large_image" : "summary",
      title: recipe.title,
      description,
      ...(recipe.image_url && { images: [recipe.image_url] }),
    },
  };
}

export default async function PublicRecipePage({ params }: Props) {
  const supabase = createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, title, description, instructions, image_url, prep_time_minutes, cook_time_minutes, servings, source_name, source_url, created_by")
    .eq("id", params.id)
    .eq("visibility", "public")
    .single();

  if (!recipe) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-2xl text-ink">This recipe is private or doesn&apos;t exist</p>
        <p className="mt-2 font-body text-sm text-ink-secondary">
          Sign up for EefEats to discover and share recipes with friends.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-block bg-ink px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white transition-opacity hover:opacity-80"
        >
          Sign up for EefEats
        </Link>
      </div>
    );
  }

  const [{ data: ingredients }, { data: tags }, { data: creator }] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select("id, quantity, unit, ingredient_name, notes")
      .eq("recipe_id", recipe.id)
      .order("order_index"),
    supabase
      .from("recipe_tags")
      .select("id, tag")
      .eq("recipe_id", recipe.id)
      .order("tag"),
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", recipe.created_by)
      .single(),
  ]);

  const instructions = recipe.instructions
    ? recipe.instructions.split(/\n/).map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-2xl bg-bg px-4 py-8">
      {recipe.image_url && (
        <div className="mb-6 aspect-video w-full overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {creator?.display_name && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
          By {creator.display_name}
        </p>
      )}

      <h1 className="mb-4 font-display text-4xl leading-tight text-ink">{recipe.title}</h1>

      {(tags || []).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(tags || []).map((t) => (
            <span
              key={t.id}
              className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-secondary"
            >
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {recipe.source_name && (
        <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
          {recipe.source_url ? (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              from {recipe.source_name}
            </a>
          ) : (
            <>from {recipe.source_name}</>
          )}
        </p>
      )}

      {recipe.description && (
        <p className="mb-8 font-body leading-relaxed text-ink-secondary whitespace-pre-line">
          {recipe.description}
        </p>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        {recipe.prep_time_minutes && (
          <span className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
            Prep: {recipe.prep_time_minutes} min
          </span>
        )}
        {recipe.cook_time_minutes && (
          <span className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
            Cook: {recipe.cook_time_minutes} min
          </span>
        )}
        {recipe.servings && (
          <span className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
            Servings: {recipe.servings}
          </span>
        )}
        {recipe.prep_time_minutes && recipe.cook_time_minutes && (
          <span className="bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
            Total: {recipe.prep_time_minutes + recipe.cook_time_minutes} min
          </span>
        )}
      </div>

      {(ingredients || []).length > 0 && (
        <div className="mb-10">
          <div className="mb-4 border-b border-border pb-2">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Ingredients</h2>
          </div>
          <ul className="space-y-2">
            {(ingredients || []).map((ing) => (
              <li key={ing.id} className="flex items-baseline gap-2 border-b border-border pb-2">
                <span className="min-w-[4rem] text-right font-body font-medium text-ink">
                  {formatQuantity(ing.quantity)} {ing.unit || ""}
                </span>
                <span className="font-body text-ink-secondary">{ing.ingredient_name}</span>
                {ing.notes && <span className="font-body text-sm text-ink-muted">({ing.notes})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {instructions.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 border-b border-border pb-2">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Preparation</h2>
          </div>
          {instructions.length === 1 ? (
            <div className="font-body leading-relaxed text-ink-secondary whitespace-pre-line">
              {instructions[0]}
            </div>
          ) : (
            <ol className="space-y-5">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink font-mono text-xs text-white">
                    {i + 1}
                  </span>
                  <p className="font-body leading-relaxed text-ink-secondary pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="mt-12 border border-border bg-surface-alt p-6 text-center">
        <p className="font-display text-xl text-ink">Want to save this recipe?</p>
        <p className="mt-1 font-body text-sm text-ink-secondary">
          Join EefEats to save recipes, track what you cook, and discover new favorites.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block bg-ink px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white transition-opacity hover:opacity-80"
        >
          Sign up for EefEats
        </Link>
      </div>
    </div>
  );
}
