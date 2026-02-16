"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeForm, type RecipeFormData } from "../components/recipe-form";
import { createRecipe } from "../actions";
import { extractFromInstagramUrl } from "./actions";

export default function ImportInstagramPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<RecipeFormData & { source_name: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await extractFromInstagramUrl(url);
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
        source_name: result.data.source_name,
      });
    }
    setLoading(false);
  }

  async function handleSave(formData: FormData) {
    formData.set("source_type", "instagram");
    formData.set("source_url", url);
    if (importedData?.source_name) {
      formData.set("source_name", importedData.source_name);
    }
    return createRecipe(formData);
  }

  if (importedData) {
    return (
      <div>
        <div className="mb-8">
          <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
            &larr; Back to recipes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Review Imported Recipe</h1>
          <p className="mt-1 text-sm text-warm-gray">Extracted from Instagram. Review and edit before saving.</p>
        </div>
        <RecipeForm
          initialData={importedData}
          action={handleSave}
          submitLabel="Save Recipe"
        />
        <button
          onClick={() => { setImportedData(null); setError(null); }}
          className="mt-4 text-sm text-warm-gray underline hover:text-accent"
        >
          Try a different URL
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Import from Instagram</h1>
        <p className="mt-1 text-sm text-warm-gray">Paste an Instagram post link to extract the recipe.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-warm-gray">
            Instagram Post URL
          </label>
          <input
            id="url"
            type="url"
            required
            placeholder="https://www.instagram.com/p/..."
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
    </div>
  );
}
