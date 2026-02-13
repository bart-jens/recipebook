"use client";

import Link from "next/link";
import { DeleteButton } from "./delete-button";
import { UnitToggle, useUnitSystem } from "./unit-toggle";
import { convertIngredient, formatQuantity } from "@/lib/unit-conversion";

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  source_url: string | null;
  source_type: string;
}

function formatInstructions(text: string): string[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return [text];
}

export function RecipeDetail({
  recipe,
  ingredients,
}: {
  recipe: Recipe;
  ingredients: Ingredient[];
}) {
  const [unitSystem, setUnitSystem] = useUnitSystem();

  const instructions = recipe.instructions ? formatInstructions(recipe.instructions) : [];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
      </div>

      <div className="mb-3 flex items-start justify-between">
        <h1 className="font-serif text-3xl font-semibold leading-tight">{recipe.title}</h1>
        <div className="flex gap-2 pt-1">
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Edit
          </Link>
          <DeleteButton recipeId={recipe.id} />
        </div>
      </div>

      {recipe.source_url && (
        <a
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-block text-sm text-accent hover:underline"
        >
          View original source &rarr;
        </a>
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
        {recipe.servings && (
          <span className="rounded-full bg-warm-tag px-3 py-1 text-sm text-warm-gray">
            Servings: {recipe.servings}
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
            <h2 className="font-serif text-xs font-medium uppercase tracking-widest text-warm-gray">Ingredients</h2>
            <UnitToggle system={unitSystem} onChange={setUnitSystem} />
          </div>
          <ul className="space-y-2">
            {ingredients.map((ing) => {
              const converted = convertIngredient(ing.quantity, ing.unit || "", unitSystem);
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
            <h2 className="font-serif text-xs font-medium uppercase tracking-widest text-warm-gray">Preparation</h2>
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
    </div>
  );
}
