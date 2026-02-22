"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { removeRecipeFromCollection } from "../actions";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
}

export function CollectionRecipeList({
  collectionId,
  initialRecipes,
}: {
  collectionId: string;
  initialRecipes: Recipe[];
}) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = search
    ? recipes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  function handleRemove(recipeId: string) {
    startTransition(async () => {
      const result = await removeRecipeFromCollection(collectionId, recipeId);
      if (!result.error) {
        setRecipes(recipes.filter((r) => r.id !== recipeId));
      }
    });
  }

  return (
    <div>
      {recipes.length > 3 && (
        <input
          type="text"
          placeholder="Search in collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 block w-full bg-warm-tag px-3 py-2 text-sm focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
        />
      )}

      {filtered.length === 0 ? (
        <div className="border border-accent/20 bg-accent/5 p-8 text-center">
          <p className="text-warm-gray">
            {search ? "No recipes match your search." : "No recipes in this collection yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe, i) => {
            const timeInfo = [
              recipe.prep_time_minutes && `${recipe.prep_time_minutes} min prep`,
              recipe.cook_time_minutes && `${recipe.cook_time_minutes} min cook`,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={recipe.id}
                className="flex items-center gap-3 border border-warm-border bg-warm-tag"
              >
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="flex flex-1 gap-4 p-4 transition-all hover:-translate-y-px hover:shadow-sm"
                >
                  {recipe.image_url && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-sans text-base font-medium">{recipe.title}</h3>
                    {recipe.description && (
                      <p className="mt-0.5 text-sm text-warm-gray line-clamp-1">{recipe.description}</p>
                    )}
                    {timeInfo && <p className="mt-0.5 text-xs text-warm-gray">{timeInfo}</p>}
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(recipe.id)}
                  disabled={isPending}
                  className="mr-3 text-xs text-warm-gray/40 hover:text-red-500 disabled:opacity-50"
                  title="Remove from collection"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
