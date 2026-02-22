"use client";

export interface Ingredient {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface IngredientRowsProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

const inputClass =
  "bg-warm-tag px-2 py-3 text-base focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent";

export function IngredientRows({ ingredients, onChange }: IngredientRowsProps) {
  function update(index: number, field: keyof Ingredient, value: string) {
    const updated = ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    );
    onChange(updated);
  }

  function add() {
    onChange([...ingredients, { ingredient_name: "", quantity: "", unit: "", notes: "" }]);
  }

  function remove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...ingredients];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  }

  function moveDown(index: number) {
    if (index === ingredients.length - 1) return;
    const updated = [...ingredients];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-warm-gray">Ingredients</label>
      {ingredients.map((ing, i) => (
        <div key={i} className="flex flex-col gap-2 bg-warm-surface p-3">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Qty"
              value={ing.quantity}
              onChange={(e) => update(i, "quantity", e.target.value)}
              className={`w-16 shrink-0 sm:w-20 ${inputClass}`}
            />
            <input
              type="text"
              placeholder="Unit"
              value={ing.unit}
              onChange={(e) => update(i, "unit", e.target.value)}
              className={`w-16 shrink-0 sm:w-24 ${inputClass}`}
            />
            <input
              type="text"
              placeholder="Ingredient name"
              required
              value={ing.ingredient_name}
              onChange={(e) => update(i, "ingredient_name", e.target.value)}
              className={`min-w-0 flex-1 ${inputClass}`}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Notes (optional)"
              value={ing.notes}
              onChange={(e) => update(i, "notes", e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="rounded px-2 py-1 text-warm-gray hover:bg-warm-tag disabled:opacity-30"
                title="Move up"
              >
                &#x2191;
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === ingredients.length - 1}
                className="rounded px-2 py-1 text-warm-gray hover:bg-warm-tag disabled:opacity-30"
                title="Move down"
              >
                &#x2193;
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded px-2 py-1 text-red-500 hover:bg-red-50"
                title="Remove"
              >
                &#x2715;
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="border border-dashed border-warm-border/50 px-4 py-3 text-sm text-warm-gray hover:bg-warm-tag w-full"
      >
        + Add ingredient
      </button>
    </div>
  );
}
