"use client";

import { useState, useRef } from "react";
import { IngredientRows, type Ingredient } from "./ingredient-rows";

export interface RecipeFormData {
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes: string;
  cook_time_minutes: string;
  servings: string;
  ingredients: Ingredient[];
}

interface RecipeFormProps {
  initialData?: RecipeFormData;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel: string;
  sourceName?: string | null;
  onSourceNameChange?: (value: string) => void;
  showImageUpload?: boolean;
}

const emptyForm: RecipeFormData = {
  title: "",
  description: "",
  instructions: "",
  prep_time_minutes: "",
  cook_time_minutes: "",
  servings: "",
  ingredients: [],
};

const inputClass =
  "mt-1 block w-full bg-warm-tag px-3 py-3 text-base focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent";

function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function RecipeForm({ initialData, action, submitLabel, sourceName, onSourceNameChange, showImageUpload = false }: RecipeFormProps) {
  const [data, setData] = useState<RecipeFormData>(initialData ?? emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField(field: keyof Omit<RecipeFormData, "ingredients">, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function updateIngredients(ingredients: Ingredient[]) {
    setData((prev) => ({ ...prev, ingredients }));
    setError(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await resizeImage(file, 1200);
      setImageBase64(base64);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
    } catch {
      setError("Failed to process image. Try a different photo.");
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description);
    formData.set("instructions", data.instructions);
    formData.set("prep_time_minutes", data.prep_time_minutes);
    formData.set("cook_time_minutes", data.cook_time_minutes);
    formData.set("servings", data.servings);
    formData.set("ingredients", JSON.stringify(data.ingredients));
    if (onSourceNameChange !== undefined) {
      formData.set("source_name", sourceName || "");
    }
    if (imageBase64) {
      formData.set("image_base64", imageBase64);
    }

    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {showImageUpload && (
        <div>
          <label className="block text-sm font-normal text-warm-gray mb-2">
            Photo
          </label>
          {imagePreview ? (
            <div className="relative w-full max-w-[280px]">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full aspect-[4/3] object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-ink/60 text-bg text-[14px] leading-none flex items-center justify-center hover:bg-ink/80 transition-colors"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-warm-tag px-4 py-3 text-sm text-warm-gray hover:bg-warm-border transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Add photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-normal text-warm-gray">
          Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={data.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-normal text-warm-gray">
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          value={data.description}
          onChange={(e) => updateField("description", e.target.value)}
          className={inputClass}
        />
      </div>

      {onSourceNameChange !== undefined && (
        <div>
          <label htmlFor="source_name" className="block text-sm font-normal text-warm-gray">
            Source
          </label>
          <input
            id="source_name"
            type="text"
            placeholder="e.g. The Food Lab, Ottolenghi Simple"
            value={sourceName || ""}
            onChange={(e) => onSourceNameChange(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="instructions" className="block text-sm font-normal text-warm-gray">
          Instructions
        </label>
        <textarea
          id="instructions"
          rows={6}
          value={data.instructions}
          onChange={(e) => updateField("instructions", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="prep_time" className="block text-sm font-normal text-warm-gray">
            Prep time (min)
          </label>
          <input
            id="prep_time"
            type="number"
            min="0"
            value={data.prep_time_minutes}
            onChange={(e) => updateField("prep_time_minutes", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cook_time" className="block text-sm font-normal text-warm-gray">
            Cook time (min)
          </label>
          <input
            id="cook_time"
            type="number"
            min="0"
            value={data.cook_time_minutes}
            onChange={(e) => updateField("cook_time_minutes", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="servings" className="block text-sm font-normal text-warm-gray">
            Servings
          </label>
          <input
            id="servings"
            type="number"
            min="1"
            value={data.servings}
            onChange={(e) => updateField("servings", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <IngredientRows ingredients={data.ingredients} onChange={updateIngredients} />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cta px-4 py-3 text-base font-normal text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50 md:w-auto"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
