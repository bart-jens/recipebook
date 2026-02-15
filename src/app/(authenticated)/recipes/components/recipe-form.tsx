"use client";

import { useState } from "react";
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
  "mt-1 block w-full rounded-md border border-warm-border bg-white px-3 py-3 text-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function RecipeForm({ initialData, action, submitLabel }: RecipeFormProps) {
  const [data, setData] = useState<RecipeFormData>(initialData ?? emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof Omit<RecipeFormData, "ingredients">, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function updateIngredients(ingredients: Ingredient[]) {
    setData((prev) => ({ ...prev, ingredients }));
    setError(null);
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

    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-warm-gray">
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
        <label htmlFor="description" className="block text-sm font-medium text-warm-gray">
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

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-warm-gray">
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
          <label htmlFor="prep_time" className="block text-sm font-medium text-warm-gray">
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
          <label htmlFor="cook_time" className="block text-sm font-medium text-warm-gray">
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
          <label htmlFor="servings" className="block text-sm font-medium text-warm-gray">
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
        className="w-full rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover disabled:opacity-50 md:w-auto"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
