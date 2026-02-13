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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold">Recipes</h1>
          <Link
            href="/recipes/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            + New recipe
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/recipes/import-url"
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Import URL
          </Link>
          <Link
            href="/recipes/import-instagram"
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Import Instagram
          </Link>
          <Link
            href="/recipes/import-photo"
            className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
          >
            Import Photo
          </Link>
        </div>
      </div>

      {!recipes || recipes.length === 0 ? (
        <div className="rounded-md border border-dashed border-warm-border p-8 text-center">
          <p className="text-warm-gray">No recipes yet.</p>
          <div className="mt-2 flex gap-3 justify-center">
            <Link
              href="/recipes/new"
              className="text-sm font-medium text-accent underline"
            >
              Create your first recipe
            </Link>
            <span className="text-warm-border">or</span>
            <Link
              href="/recipes/import-url"
              className="text-sm font-medium text-accent underline"
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
                className="block rounded-md border border-warm-border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <h2 className="font-serif text-lg font-medium">{recipe.title}</h2>
                {recipe.description && (
                  <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                {timeInfo && (
                  <p className="mt-2 text-xs text-warm-gray">{timeInfo}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
