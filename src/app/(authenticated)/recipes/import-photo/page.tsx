"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeForm, type RecipeFormData } from "../components/recipe-form";
import { createRecipe } from "../actions";
import { extractFromPhotoBase64 } from "./actions";

function resizeImage(file: File, maxSize: number): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG for smaller size
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mediaType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ImportPhotoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<RecipeFormData | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem("image") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError("No file selected");
      setLoading(false);
      return;
    }

    try {
      // Resize client-side to stay under Vercel's 4.5MB limit
      const { base64, mediaType } = await resizeImage(file, 1200);
      const result = await extractFromPhotoBase64(base64, mediaType);

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
    } catch {
      setError("Failed to process image. Try a different photo.");
    }

    setLoading(false);
  }

  async function handleSave(formData: FormData) {
    formData.set("source_type", "photo");
    if (sourceName.trim()) {
      formData.set("source_name", sourceName.trim());
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
          <p className="mt-1 text-sm text-warm-gray">Extracted from photo. Review and edit before saving.</p>
        </div>
        <div className="mb-6 max-w-2xl">
          <label htmlFor="source_name" className="block text-sm font-medium text-warm-gray">
            Source (optional)
          </label>
          <input
            id="source_name"
            type="text"
            placeholder="e.g. The Food Lab, Ottolenghi Simple"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-warm-gray/60">Where is this recipe from? Cookbook, website, family recipe...</p>
        </div>
        <RecipeForm
          initialData={importedData}
          action={handleSave}
          submitLabel="Save Recipe"
        />
        <button
          onClick={() => { setImportedData(null); setError(null); setFileName(null); }}
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
        <h1 className="mt-2 text-2xl font-semibold">Import from Photo</h1>
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
            onChange={(e) => {
              setError(null);
              setFileName(e.target.files?.[0]?.name || null);
            }}
            className="mt-1 block w-full text-sm text-warm-gray file:mr-4 file:rounded-md file:border file:border-warm-border file:bg-warm-tag file:px-4 file:py-2 file:text-sm file:font-medium file:text-warm-gray hover:file:bg-warm-divider"
          />
          {fileName && (
            <p className="mt-1 text-xs text-warm-gray">Image will be resized for processing.</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover disabled:opacity-50"
        >
          {loading ? "Extracting recipe..." : "Extract Recipe"}
        </button>
      </form>
    </div>
  );
}
