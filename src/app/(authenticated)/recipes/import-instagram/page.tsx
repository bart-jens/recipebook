"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeForm, type RecipeFormData } from "../components/recipe-form";
import { createRecipe } from "../actions";
import { extractFromCaption, extractFromImage } from "./actions";

type Tab = "caption" | "image";

export default function ImportInstagramPage() {
  const [tab, setTab] = useState<Tab>("caption");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<RecipeFormData | null>(null);

  async function handleCaptionSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await extractFromCaption(caption);
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

  async function handleImageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const result = await extractFromImage(formData);
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
    formData.set("source_type", "instagram");
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
          Try again
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
        <h1 className="mt-2 font-serif text-2xl font-semibold">Import from Instagram</h1>
        <p className="mt-1 text-sm text-warm-gray">Paste a caption or upload a recipe card screenshot.</p>
      </div>

      <div className="mb-6 inline-flex rounded-md border border-warm-border text-sm">
        <button
          onClick={() => { setTab("caption"); setError(null); }}
          className={`px-4 py-2 rounded-l-md ${tab === "caption" ? "bg-accent text-white" : "text-warm-gray hover:bg-warm-tag"}`}
        >
          Paste Caption
        </button>
        <button
          onClick={() => { setTab("image"); setError(null); }}
          className={`px-4 py-2 rounded-r-md ${tab === "image" ? "bg-accent text-white" : "text-warm-gray hover:bg-warm-tag"}`}
        >
          Upload Image
        </button>
      </div>

      {tab === "caption" ? (
        <form onSubmit={handleCaptionSubmit} className="max-w-2xl space-y-4">
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-warm-gray">
              Instagram Caption
            </label>
            <textarea
              id="caption"
              rows={8}
              required
              placeholder="Paste the Instagram post caption here..."
              value={caption}
              onChange={(e) => { setCaption(e.target.value); setError(null); }}
              className="mt-1 block w-full rounded-md border border-warm-border bg-white px-3 py-3 text-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
      ) : (
        <form onSubmit={handleImageSubmit} className="max-w-2xl space-y-4">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-warm-gray">
              Recipe Card Image
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
      )}
    </div>
  );
}
