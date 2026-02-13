"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeForm, type RecipeFormData } from "../components/recipe-form";
import { createRecipe } from "../actions";
import { extractFromPhoto } from "./actions";

export default function ImportPhotoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<RecipeFormData | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const result = await extractFromPhoto(formData);
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
      });
    }
    setLoading(false);
  }

  async function handleSave(formData: FormData) {
    formData.set("source_type", "photo");
    return createRecipe(formData);
  }

  if (importedData) {
    return (
      <div>
        <div className="mb-8">
          <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
            &larr; Back to recipes
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold">Review Imported Recipe</h1>
          <p className="mt-1 text-sm text-warm-gray">Extracted from photo. Review and edit before saving.</p>
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
          Try a different photo
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
        <h1 className="mt-2 font-serif text-2xl font-semibold">Import from Photo</h1>
        <p className="mt-1 text-sm text-warm-gray">Upload a photo of a recipe card or cookbook page.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-warm-gray">
            Recipe Photo
          </label>
          <input
            id="image"
            name="image"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            onChange={() => setError(null)}
            className="mt-1 block w-full text-sm text-warm-gray file:mr-4 file:rounded-md file:border file:border-warm-border file:bg-warm-tag file:px-4 file:py-2 file:text-sm file:font-medium file:text-warm-gray hover:file:bg-warm-divider"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-3 text-base font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Extracting recipe..." : "Extract Recipe"}
        </button>
      </form>
    </div>
  );
}
