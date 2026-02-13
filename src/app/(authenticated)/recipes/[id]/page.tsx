import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "./delete-button";

export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!recipe) notFound();

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", recipe.id)
    .order("order_index");

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/recipes" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </Link>
      </div>

      <div className="mb-4 flex items-start justify-between">
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

      {recipe.description && (
        <p className="mb-4 text-gray-600">{recipe.description}</p>
      )}

      <div className="mb-6 flex gap-4 text-sm text-gray-500">
        {recipe.prep_time_minutes && <span>{recipe.prep_time_minutes} min prep</span>}
        {recipe.cook_time_minutes && <span>{recipe.cook_time_minutes} min cook</span>}
        {recipe.servings && <span>{recipe.servings} servings</span>}
      </div>

      {ingredients && ingredients.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-medium">Ingredients</h2>
          <ul className="space-y-1">
            {ingredients.map((ing) => (
              <li key={ing.id} className="text-gray-700">
                {ing.quantity && <span>{ing.quantity} </span>}
                {ing.unit && <span>{ing.unit} </span>}
                <span>{ing.ingredient_name}</span>
                {ing.notes && <span className="text-gray-400"> ({ing.notes})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions && (
        <div>
          <h2 className="mb-2 font-medium">Instructions</h2>
          <div className="whitespace-pre-wrap text-gray-700">{recipe.instructions}</div>
        </div>
      )}
    </div>
  );
}
