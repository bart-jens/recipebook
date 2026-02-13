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
  // Split on numbered steps (e.g., "1.", "2.") or double newlines
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // If lines are already numbered, return as-is
  if (lines.length > 1) return lines;

  // Single block of text — split on sentence boundaries for readability
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
      <div className="mb-6 flex items-center gap-4">
        <Link href="/recipes" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </Link>
      </div>

      <div className="mb-2 flex items-start justify-between">
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
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
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          View original source &rarr;
        </a>
      )}

      {recipe.description && (
        <div className="mb-6 mt-4">
          <h2 className="mb-2 text-lg font-medium">About</h2>
          <p className="leading-relaxed text-gray-600 whitespace-pre-line">{recipe.description}</p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        {recipe.prep_time_minutes && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            Prep: {recipe.prep_time_minutes} min
          </span>
        )}
        {recipe.cook_time_minutes && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            Cook: {recipe.cook_time_minutes} min
          </span>
        )}
        {recipe.servings && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            Servings: {recipe.servings}
          </span>
        )}
        {recipe.prep_time_minutes && recipe.cook_time_minutes && (
          <span className="rounded-full bg-gray-900 px-3 py-1 text-sm text-white">
            Total: {recipe.prep_time_minutes + recipe.cook_time_minutes} min
          </span>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Ingredients</h2>
            <UnitToggle system={unitSystem} onChange={setUnitSystem} />
          </div>
          <ul className="space-y-2">
            {ingredients.map((ing) => {
              const converted = convertIngredient(ing.quantity, ing.unit || "", unitSystem);
              return (
                <li key={ing.id} className="flex items-baseline gap-2 border-b border-gray-100 pb-2">
                  <span className="min-w-[4rem] text-right font-medium text-gray-900">
                    {formatQuantity(converted.quantity)} {converted.unit}
                  </span>
                  <span className="text-gray-700">{ing.ingredient_name}</span>
                  {ing.notes && <span className="text-sm text-gray-400">({ing.notes})</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {instructions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Instructions</h2>
          {instructions.length === 1 ? (
            <div className="leading-relaxed text-gray-700 whitespace-pre-line">
              {instructions[0]}
            </div>
          ) : (
            <ol className="space-y-4">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed text-gray-700 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
