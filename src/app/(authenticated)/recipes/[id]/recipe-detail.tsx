"use client";

import { useState } from "react";
import Link from "next/link";

import { DeleteButton } from "./delete-button";
import { UnitToggle, useUnitSystem } from "./unit-toggle";
import { convertIngredient, formatQuantity } from "@/lib/unit-conversion";
import { TagEditor } from "./tag-editor";
import { FavoriteButton } from "./favorite-button";
import { CookingLog } from "./cooking-log";
import { VisibilityToggle } from "./visibility-toggle";
import { ShareLinkButton } from "./share-link-button";
import { SaveButton } from "./save-button";
import { PhotoCarousel } from "./photo-carousel";
import { CollectionPicker } from "./collection-picker";
import { addRecipeToDefaultShoppingList, addIngredientToDefaultShoppingList } from "@/app/(authenticated)/shopping-list/actions";


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
  forked_from_id: string | null;
  language?: string | null;
  visibility: string;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function stripLeadingMarker(line: string): string {
  return line.replace(/^(?:\d+[\.\)]\s*|[-*\u2022\u2013\u2014]\s*|step\s+\d+[:\.\)]*\s*)/i, '');
}

function formatInstructions(text: string): string[] {
  const lines = text.split(/\n/).map((l) => stripLeadingMarker(l.trim())).filter(Boolean);
  if (lines.length > 1) return lines;
  return [text];
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  photos?: { id: string; url: string; imageType: string }[];
}) {
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const [servings, setServings] = useState(recipe.servings ?? 0);
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());
  const [addingIngredient, setAddingIngredient] = useState<string | null>(null);
  const [addedAll, setAddedAll] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const scaleFactor = recipe.servings ? servings / recipe.servings : 1;

  const instructions = recipe.instructions ? formatInstructions(recipe.instructions) : [];

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null;

  const heroImage = photos && photos.length > 0
    ? photos[0].url
    : recipe.image_url || null;

  const hasMultiplePhotos = photos && photos.length > 1;

  // Determine the first tag as category
  const category = tags.length > 0 ? tags[0].tag : null;

  function toggleIngredientCheck(index: number) {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="-mx-5">
      {/* Detail Nav — sticky blurred */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 backdrop-blur-[20px] bg-[rgba(246,244,239,0.92)]">
        <Link
          href="/recipes"
          className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors active:translate-x-[-3px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-3.5">
          {isOwner ? (
            <>
              <FavoriteButton recipeId={recipe.id} isFavorited={isFavorited} />
              {recipe.source_type === "manual" && !recipe.forked_from_id && (
                <VisibilityToggle recipeId={recipe.id} isPublic={recipe.visibility === "public"} />
              )}
              {recipe.visibility === "public" && (
                <ShareLinkButton recipeId={recipe.id} title={recipe.title} />
              )}
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink flex items-center gap-1 transition-colors active:scale-[0.94]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </Link>
              <DeleteButton recipeId={recipe.id} />
            </>
          ) : (
            <>
              <SaveButton recipeId={recipe.id} isSaved={isSaved} />
              <FavoriteButton recipeId={recipe.id} isFavorited={isFavorited} />
              {recipe.visibility === "public" && (
                <ShareLinkButton recipeId={recipe.id} title={recipe.title} />
              )}
            </>
          )}
        </div>
      </nav>

      {/* Hero Image */}
      {heroImage && (
        hasMultiplePhotos ? (
          <div className="px-5 mb-2 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <PhotoCarousel photos={photos!} />
          </div>
        ) : (
          <div className="overflow-hidden h-[220px] relative opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <img
              src={heroImage}
              alt={recipe.title}
              className="w-full h-full object-cover animate-hero-zoom"
            />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg to-transparent" />
          </div>
        )
      )}

      {/* Header */}
      <div className={`px-5 relative ${heroImage && !hasMultiplePhotos ? "-mt-4" : "pt-4"}`}>
        {category && (
          <div className="text-[11px] font-normal tracking-[0.02em] text-accent mb-1.5 opacity-0 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            {category}
          </div>
        )}
        <h1 className="text-[36px] font-light tracking-[-0.03em] leading-[1.1] text-ink mb-2.5 opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          {recipe.title}
        </h1>
        <div className="text-[13px] font-light text-ink-secondary mb-1 opacity-0 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
          {creatorName && creatorId ? (
            <>
              By{" "}
              <Link href={`/profile/${creatorId}`} className="font-normal text-ink hover:text-accent transition-colors">
                {creatorName}
              </Link>
            </>
          ) : isOwner ? (
            <>By <span className="font-normal text-ink">you</span></>
          ) : null}
          {cookEntries.length > 0 && (
            <> · Cooked {cookEntries.length} time{cookEntries.length !== 1 ? "s" : ""}</>
          )}
          {avgRating != null && (
            <> · {avgRating.toFixed(1)} rating</>
          )}
        </div>

        {recipe.source_type !== "manual" && (recipe.source_name || recipe.source_url) && (
          <div className="text-[12px] text-ink-muted mb-1 opacity-0 animate-fade-in-up" style={{ animationDelay: "260ms" }}>
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


        <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "270ms" }}>
          {recipe.updated_at ? `Updated ${formatDate(recipe.updated_at)}` : recipe.created_at ? formatDate(recipe.created_at) : null}
        </div>
      </div>

      {/* Stats Bar */}
      {(recipe.prep_time_minutes || recipe.cook_time_minutes || recipe.servings || avgRating != null) && (
        <div className="mx-5 border-t-[3px] border-t-ink border-b border-b-ink flex opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          {recipe.prep_time_minutes && (
            <div className="flex-1 py-2.5 px-3 text-center border-r border-border hover:bg-accent-light transition-colors">
              <div className="text-[20px] font-normal text-ink">{formatTime(recipe.prep_time_minutes)}</div>
              <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Prep</div>
            </div>
          )}
          {recipe.cook_time_minutes && (
            <div className="flex-1 py-2.5 px-3 text-center border-r border-border hover:bg-accent-light transition-colors">
              <div className="text-[20px] font-normal text-ink">{formatTime(recipe.cook_time_minutes)}</div>
              <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Cook</div>
            </div>
          )}
          {recipe.servings && (
            <div className="flex-1 py-2.5 px-3 text-center border-r border-border hover:bg-accent-light transition-colors cursor-pointer group">
              <div className="text-[20px] font-normal text-ink flex items-center justify-center gap-1">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-accent text-[14px] transition-opacity"
                >
                  -
                </button>
                <span>{servings}</span>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-accent text-[14px] transition-opacity"
                >
                  +
                </button>
              </div>
              <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                Serves
                {servings !== recipe.servings && (
                  <button
                    onClick={() => setServings(recipe.servings!)}
                    className="ml-1 text-accent hover:underline"
                  >
                    reset
                  </button>
                )}
              </div>
            </div>
          )}
          {avgRating != null && (
            <div className="flex-1 py-2.5 px-3 text-center hover:bg-accent-light transition-colors">
              <div className="text-[20px] font-normal text-ink">{avgRating.toFixed(1)}</div>
              <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Rating</div>
            </div>
          )}
          {recipe.prep_time_minutes && recipe.cook_time_minutes && (
            <div className="flex-1 py-2.5 px-3 text-center hover:bg-accent-light transition-colors">
              <div className="text-[20px] font-normal text-ink">{formatTime(recipe.prep_time_minutes + recipe.cook_time_minutes)}</div>
              <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Total</div>
            </div>
          )}
        </div>
      )}

      {/* Tags + Controls Row */}
      <div className="px-5 pt-4 flex flex-wrap items-center gap-2">
        {isOwner && (
          <div className="w-full opacity-0 animate-fade-in-up" style={{ animationDelay: "340ms" }}>
            <TagEditor recipeId={recipe.id} tags={tags} />
          </div>
        )}
        {!isOwner && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 opacity-0 animate-fade-in-up" style={{ animationDelay: "340ms" }}>
            {tags.map((t) => (
              <span
                key={t.id}
                className="text-[11px] font-normal tracking-[0.02em] border border-border text-ink-muted px-2 py-0.5"
              >
                {t.tag}
              </span>
            ))}
          </div>
        )}
        <div className="w-full opacity-0 animate-fade-in-up" style={{ animationDelay: "360ms" }}>
          <CollectionPicker recipeId={recipe.id} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-6 pb-24">
        {/* Intro / Description */}
        {recipe.description && (
          <p className="text-[15px] font-light text-ink-secondary leading-[1.45] max-w-[360px] mb-7 opacity-0 animate-fade-in-up" style={{ animationDelay: "350ms" }}>
            {recipe.description}
          </p>
        )}

        {/* Public recipe rating display for non-owners */}
        {recipe.visibility === "public" && !isOwner && ratings.length > 0 && (() => {
          return (
            <div className="flex items-center gap-2 mb-5 opacity-0 animate-fade-in-up" style={{ animationDelay: "370ms" }}>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(avgRating!) ? "text-accent" : "text-border"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                {avgRating!.toFixed(1)} ({ratings.length} {ratings.length === 1 ? "rating" : "ratings"})
              </span>
            </div>
          );
        })()}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between text-[11px] font-normal tracking-[0.02em] mb-2.5 pb-1.5 border-b border-border">
              <span>Ingredients</span>
              <UnitToggle system={unitSystem} onChange={setUnitSystem} />
            </div>
            <ul className="list-none mb-4">
              {ingredients.map((ing, index) => {
                const scaledQty = ing.quantity != null ? ing.quantity * scaleFactor : null;
                const converted = convertIngredient(scaledQty, ing.unit || "", unitSystem);
                const isChecked = checkedIngredients.has(index);
                const isAdded = addedIngredients.has(ing.id) || addedAll;
                const isAdding = addingIngredient === ing.id;
                return (
                  <li
                    key={ing.id}
                    className="flex items-center gap-2.5 py-2 border-b border-dotted border-border cursor-pointer transition-all hover:pl-1"
                    onClick={() => toggleIngredientCheck(index)}
                  >
                    {/* Checkbox */}
                    <span
                      className={`w-4 h-4 border-[1.5px] rounded-[2px] flex-shrink-0 relative transition-all duration-200 ${
                        isChecked
                          ? "bg-accent border-accent animate-check-pop"
                          : "border-border hover:border-accent hover:scale-110"
                      }`}
                    >
                      {isChecked && (
                        <span className="absolute left-[3px] top-0 w-[5px] h-[9px] border-white border-r-[1.5px] border-b-[1.5px] rotate-45" />
                      )}
                    </span>
                    {/* Ingredient name */}
                    <span className={`flex-1 text-[14px] transition-all duration-250 ${
                      isChecked ? "text-ink-muted line-through decoration-accent" : "text-ink"
                    }`}>
                      {ing.ingredient_name}
                      {ing.notes && <span className="text-ink-muted text-[12px]"> ({ing.notes})</span>}
                    </span>
                    {/* Amount */}
                    <span className={`text-[12px] font-normal tracking-[0.02em] text-ink-secondary flex-shrink-0 transition-opacity ${
                      isChecked ? "opacity-40" : ""
                    }`}>
                      {formatQuantity(converted.quantity)} {converted.unit}
                    </span>
                    {/* Add to grocery list button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (isAdded) return;
                        setAddingIngredient(ing.id);
                        const result = await addIngredientToDefaultShoppingList(
                          ing.ingredient_name,
                          ing.quantity,
                          ing.unit,
                        );
                        setAddingIngredient(null);
                        if (!result?.error) {
                          setAddedIngredients((prev) => new Set(prev).add(ing.id));
                        }
                      }}
                      disabled={isAdded || isAdding}
                      className={`shrink-0 flex h-6 w-6 items-center justify-center transition-colors ${
                        isAdded
                          ? "text-accent"
                          : "text-ink-muted/40 hover:text-accent"
                      }`}
                      aria-label={isAdded ? "Added to list" : `Add ${ing.ingredient_name} to grocery list`}
                    >
                      {isAdding ? (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                      ) : isAdded ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={async () => {
                setAddingAll(true);
                const result = await addRecipeToDefaultShoppingList(recipe.id);
                setAddingAll(false);
                if (!result?.error) {
                  setAddedAll(true);
                  setTimeout(() => setAddedAll(false), 3000);
                }
              }}
              disabled={addingAll || addedAll}
              className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-accent transition-colors disabled:opacity-50"
            >
              {addedAll ? `Added all ${ingredients.length} items` : addingAll ? "Adding..." : "Add all to Grocery List"}
            </button>
          </div>
        )}

        {/* Steps / Method */}
        {instructions.length > 0 && (
          <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "450ms" }}>
            <div className="text-[11px] font-normal tracking-[0.02em] mb-2.5 pb-1.5 border-b border-border">Method</div>
            {instructions.length === 1 ? (
              <div className="text-[14px] font-light text-ink-secondary leading-[1.6] whitespace-pre-line">
                {instructions[0]}
              </div>
            ) : (
              <ol className="list-none">
                {instructions.map((step, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[36px_1fr] gap-3 py-4 border-b border-border group transition-all hover:pl-1"
                  >
                    <span className="text-[26px] font-normal tracking-[-0.01em] leading-none text-border group-hover:text-accent transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[14px] font-light text-ink-secondary leading-[1.6] pt-1">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Cooking Log + Ratings */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <CookingLog recipeId={recipe.id} cookEntries={cookEntries} ratings={ratings} />
        </div>
      </div>
    </div>
  );
}
