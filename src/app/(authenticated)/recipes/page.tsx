import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RecipesPage() {
  const supabase = createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, prep_time_minutes, cook_time_minutes, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recipes</h1>
        <div className="flex gap-2">
          <Link
            href="/recipes/import-url"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Import from URL
          </Link>
          <Link
            href="/recipes/new"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + New recipe
          </Link>
        </div>
      </div>

      {!recipes || recipes.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No recipes yet.</p>
          <div className="mt-2 flex gap-3 justify-center">
            <Link
              href="/recipes/new"
              className="text-sm font-medium text-gray-900 underline"
            >
              Create your first recipe
            </Link>
            <span className="text-gray-300">or</span>
            <Link
              href="/recipes/import-url"
              className="text-sm font-medium text-gray-900 underline"
            >
              Import from URL
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const timeInfo = [
              recipe.prep_time_minutes && `${recipe.prep_time_minutes} min prep`,
              recipe.cook_time_minutes && `${recipe.cook_time_minutes} min cook`,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block rounded-md border border-gray-200 p-4 hover:bg-gray-50"
              >
                <h2 className="font-medium">{recipe.title}</h2>
                {recipe.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                {timeInfo && (
                  <p className="mt-1 text-xs text-gray-400">{timeInfo}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
