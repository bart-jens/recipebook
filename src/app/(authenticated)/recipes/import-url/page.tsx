"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeForm, type RecipeFormData } from "../components/recipe-form";
import { createRecipe } from "../actions";
import { fetchRecipeFromUrl } from "./actions";

export default function ImportUrlPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<RecipeFormData & { source_url: string; source_name: string; image_url: string | null } | null>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await fetchRecipeFromUrl(url);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      setImportedData({
        title: result.data.title,
        description: result.data.description,
        instructions: result.data.instructions,
        prep_time_minutes: result.data.prep_time_minutes?.toString() || "",
        cook_time_minutes: result.data.cook_time_minutes?.toString() || "",
        servings: result.data.servings?.toString() || "",
        ingredients: result.data.ingredients.map((ing) => ({
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity?.toString() || "",
          unit: ing.unit,
          notes: ing.notes,
        })),
        source_url: result.data.source_url,
        source_name: result.data.source_name,
        image_url: result.data.imageUrl || null,
      });
    }
    setLoading(false);
  }

  async function handleSave(formData: FormData) {
    if (importedData) {
      formData.set("source_type", "url");
      formData.set("source_url", importedData.source_url);
      formData.set("source_name", importedData.source_name);
      if (importedData.image_url) {
        formData.set("image_url", importedData.image_url);
      }
    }
    return createRecipe(formData);
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Import from URL</h1>
      </div>

      {!importedData ? (
        <form onSubmit={handleFetch} className="max-w-2xl space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-warm-gray">
              Recipe URL
            </label>
            <input
              id="url"
              type="url"
              required
              placeholder="https://www.example.com/recipe/..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              className="mt-1 block w-full rounded-md border border-warm-border bg-white px-3 py-3 text-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover disabled:opacity-50"
          >
            {loading ? "Fetching recipe..." : "Fetch Recipe"}
          </button>
        </form>
      ) : (
        <div>
          <p className="mb-4 text-sm text-warm-gray">
            Imported from: {importedData.source_url}
          </p>
          <RecipeForm
            initialData={importedData}
            action={handleSave}
            submitLabel="Save Recipe"
          />
          <button
            onClick={() => setImportedData(null)}
            className="mt-4 text-sm text-warm-gray underline hover:text-accent"
          >
            Try a different URL
          </button>
        </div>
      )}
    </div>
  );
}
