"use client";

import { useState } from "react";
import Link from "next/link";

import { DeleteButton } from "./delete-button";
import { UnitToggle, useUnitSystem } from "./unit-toggle";
import { convertIngredient, formatQuantity } from "@/lib/unit-conversion";
import { TagEditor } from "./tag-editor";
import { FavoriteButton } from "./favorite-button";
import { CookingLog } from "./cooking-log";
import { PublishButton } from "./publish-button";
import { ShareButton } from "./share-button";
import { SaveButton } from "./save-button";
import { PhotoCarousel } from "./photo-carousel";
import { CollectionPicker } from "./collection-picker";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", nl: "Dutch", fr: "French", de: "German", es: "Spanish",
  it: "Italian", pt: "Portuguese", ja: "Japanese", zh: "Chinese", ko: "Korean",
  th: "Thai", vi: "Vietnamese", ar: "Arabic", ru: "Russian", pl: "Polish",
  sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish", tr: "Turkish",
  el: "Greek", hi: "Hindi", id: "Indonesian", ms: "Malay", he: "Hebrew",
};

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
}

interface CookEntry {
  id: string;
  cooked_at: string;
  notes: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  image_url?: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  source_url: string | null;
  source_name: string | null;
  source_type: string;
  language: string | null;
  visibility: string;
}

interface Tag {
  id: string;
  tag: string;
}

interface RatingEntry {
  id: string;
  rating: number;
  notes: string | null;
  cooked_date: string | null;
  created_at: string;
}

function formatInstructions(text: string): string[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return [text];
}

export function RecipeDetail({
  recipe,
  ingredients,
  tags,
  ratings,
  cookEntries,
  isFavorited,
  isSaved,
  isOwner,
  creatorName,
  creatorId,
  publishCount,
  userPlan,
  isShared,
  shareNotes,
  photos,
}: {
  recipe: Recipe;
  ingredients: Ingredient[];
  tags: Tag[];
  ratings: RatingEntry[];
  cookEntries: CookEntry[];
  isFavorited: boolean;
  isSaved: boolean;
  isOwner: boolean;
  creatorName: string | null;
  creatorId: string | null;
  publishCount?: number;
  userPlan?: string;
  isShared?: boolean;
  shareNotes?: string | null;
  photos?: { id: string; url: string; imageType: string }[];
}) {
  const hasCooked = cookEntries.length > 0;
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const [servings, setServings] = useState(recipe.servings ?? 0);
  const scaleFactor = recipe.servings ? servings / recipe.servings : 1;

  const instructions = recipe.instructions ? formatInstructions(recipe.instructions) : [];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
      </div>

      {photos && photos.length > 0 ? (
        <PhotoCarousel photos={photos} />
      ) : recipe.image_url ? (
        <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {creatorName && creatorId && (
        <div className="mb-3 text-sm text-warm-gray">
          By{" "}
          <Link href={`/profile/${creatorId}`} className="text-accent hover:underline">
            {creatorName}
          </Link>
        </div>
      )}

      {recipe.visibility === "public" && !isOwner && ratings.length > 0 && (() => {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        return (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(avgRating) ? "text-amber-400" : "text-warm-border"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-warm-gray">
              {avgRating.toFixed(1)} ({ratings.length} {ratings.length === 1 ? "rating" : "ratings"})
            </span>
          </div>
        );
      })()}

      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="font-sans text-3xl font-semibold leading-tight">{recipe.title}</h1>
          {recipe.visibility === "public" && isOwner && (
            <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              Published
            </span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          {isOwner ? (
            <>
              <FavoriteButton recipeId={recipe.id} isFavorited={isFavorited} hasCooked={hasCooked} />
              {recipe.source_type === "manual" ? (
                <PublishButton
                  recipeId={recipe.id}
                  isPublic={recipe.visibility === "public"}
                  publishCount={publishCount}
                  userPlan={userPlan}
                />
              ) : (
                <ShareButton
                  recipeId={recipe.id}
                  isShared={isShared ?? false}
                  existingNotes={shareNotes}
                />
              )}
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
              >
                Edit
              </Link>
              <DeleteButton recipeId={recipe.id} />
            </>
          ) : (
            <>
              <SaveButton recipeId={recipe.id} isSaved={isSaved} />
              <FavoriteButton recipeId={recipe.id} isFavorited={isFavorited} hasCooked={hasCooked} />
            </>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mb-4">
          <TagEditor recipeId={recipe.id} tags={tags} />
        </div>
      )}

      <div className="mb-4">
        <CollectionPicker recipeId={recipe.id} />
      </div>

      {!isOwner && tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-warm-tag px-3 py-1 text-sm text-warm-gray"
            >
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {recipe.source_type !== "manual" && (recipe.source_name || recipe.source_url) && (
        <div className="mb-6 text-sm text-warm-gray">
          {recipe.source_url ? (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              from {recipe.source_name || new URL(recipe.source_url).hostname.replace(/^www\./, "")}
            </a>
          ) : (
            <span>from {recipe.source_name}</span>
          )}
        </div>
      )}

      {recipe.description && (
        <div className="mb-8 mt-4">
          <p className="text-warm-gray leading-relaxed whitespace-pre-line">{recipe.description}</p>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        {recipe.prep_time_minutes && (
          <span className="rounded-full bg-warm-tag px-3 py-1 text-sm text-warm-gray">
            Prep: {recipe.prep_time_minutes} min
          </span>
        )}
        {recipe.cook_time_minutes && (
          <span className="rounded-full bg-warm-tag px-3 py-1 text-sm text-warm-gray">
            Cook: {recipe.cook_time_minutes} min
          </span>
        )}
        {recipe.language && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
            {LANGUAGE_NAMES[recipe.language] || recipe.language.toUpperCase()}
          </span>
        )}
        {recipe.servings && (
          <span className="inline-flex items-center gap-2 rounded-full bg-warm-tag px-3 py-1 text-sm text-warm-gray">
            Servings:
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent hover:bg-accent/20"
            >
              -
            </button>
            <span className="min-w-[1.5rem] text-center font-medium">{servings}</span>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent hover:bg-accent/20"
            >
              +
            </button>
            {servings !== recipe.servings && (
              <button
                onClick={() => setServings(recipe.servings!)}
                className="text-xs text-accent hover:underline"
              >
                reset
              </button>
            )}
          </span>
        )}
        {recipe.prep_time_minutes && recipe.cook_time_minutes && (
          <span className="rounded-full bg-accent px-3 py-1 text-sm text-white">
            Total: {recipe.prep_time_minutes + recipe.cook_time_minutes} min
          </span>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between border-b border-warm-divider pb-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">Ingredients</h2>
            <UnitToggle system={unitSystem} onChange={setUnitSystem} />
          </div>
          <ul className="space-y-2">
            {ingredients.map((ing) => {
              const scaledQty = ing.quantity != null ? ing.quantity * scaleFactor : null;
              const converted = convertIngredient(scaledQty, ing.unit || "", unitSystem);
              return (
                <li key={ing.id} className="flex items-baseline gap-2 border-b border-warm-divider pb-2">
                  <span className="min-w-[4rem] text-right font-medium">
                    {formatQuantity(converted.quantity)} {converted.unit}
                  </span>
                  <span className="text-warm-gray">{ing.ingredient_name}</span>
                  {ing.notes && <span className="text-sm text-warm-gray/60">({ing.notes})</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {instructions.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 border-b border-warm-divider pb-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">Preparation</h2>
          </div>
          {instructions.length === 1 ? (
            <div className="leading-relaxed text-warm-gray whitespace-pre-line">
              {instructions[0]}
            </div>
          ) : (
            <ol className="space-y-5">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed text-warm-gray pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="mb-10">
        <CookingLog recipeId={recipe.id} cookEntries={cookEntries} ratings={ratings} />
      </div>
    </div>
  );
}
