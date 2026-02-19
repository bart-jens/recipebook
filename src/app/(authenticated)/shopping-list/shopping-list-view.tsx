"use client";

import { useState, useRef } from "react";
import {
  toggleItemChecked,
  addManualItem,
  deleteItem,
  clearCheckedItems,
  clearAllItems,
  updateItemQuantity,
} from "./actions";

interface ShoppingItem {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_ids: string[];
}

export function ShoppingListView({
  listId,
  initialItems,
  recipeTitles,
}: {
  listId: string;
  initialItems: ShoppingItem[];
  recipeTitles: Record<string, string>;
}) {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [checkedExpanded, setCheckedExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  async function handleToggle(itemId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, is_checked: !i.is_checked } : i
      )
    );
    await toggleItemChecked(itemId);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    setNewItem("");
    const result = await addManualItem(listId, name);
    if (result?.item) {
      setItems((prev) => [...prev, result.item!]);
    }
    inputRef.current?.focus();
  }

  async function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await deleteItem(itemId);
  }

  async function handleClearChecked() {
    setItems((prev) => prev.filter((i) => !i.is_checked));
    setCheckedExpanded(false);
    await clearCheckedItems(listId);
  }

  async function handleClearAll() {
    if (!confirm("Clear all items from the shopping list?")) return;
    setItems([]);
    await clearAllItems(listId);
  }

  async function handleQuantityEdit(itemId: string) {
    const qty = editQty.trim() ? parseFloat(editQty) : null;
    setEditingId(null);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
    );
    await updateItemQuantity(itemId, qty);
  }

  function formatQuantity(qty: number | null) {
    if (qty === null) return "";
    if (qty === Math.floor(qty)) return String(qty);
    return qty.toFixed(1);
  }

  function getAttribution(recipeIds: string[]) {
    if (!recipeIds || recipeIds.length === 0) return null;
    const titles = recipeIds
      .map((id) => recipeTitles[id])
      .filter(Boolean);
    if (titles.length === 0) return null;
    return titles.join(", ");
  }

  function renderUncheckedItem(item: ShoppingItem) {
    const attribution = getAttribution(item.recipe_ids);
    return (
      <li
        key={item.id}
        className="group flex items-center gap-3 border-b border-warm-divider py-2.5 transition-opacity duration-200"
      >
        <button
          onClick={() => handleToggle(item.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-warm-border transition-colors hover:border-accent hover:bg-accent/10"
          aria-label={`Check off ${item.ingredient_name}`}
        >
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            {editingId === item.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuantityEdit(item.id);
                }}
                className="flex items-baseline gap-1"
              >
                <input
                  type="text"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  onBlur={() => handleQuantityEdit(item.id)}
                  autoFocus
                  className="w-16 rounded border border-warm-border px-1 py-0.5 text-sm"
                />
                <span className="text-sm text-warm-gray">{item.unit || ""}</span>
              </form>
            ) : (
              <>
                {(item.quantity !== null || item.unit) && (
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditQty(item.quantity !== null ? String(item.quantity) : "");
                    }}
                    className="shrink-0 font-medium hover:text-accent"
                  >
                    {formatQuantity(item.quantity)} {item.unit || ""}
                  </button>
                )}
              </>
            )}
            <span>{item.ingredient_name}</span>
          </div>
          {attribution && (
            <p className="truncate text-xs text-warm-gray/60">from {attribution}</p>
          )}
        </div>
        <button
          onClick={() => handleDelete(item.id)}
          className="shrink-0 text-warm-gray/40 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label={`Delete ${item.ingredient_name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    );
  }

  function renderCheckedItem(item: ShoppingItem) {
    return (
      <li
        key={item.id}
        className="group flex items-center gap-3 py-2 text-warm-gray/50"
      >
        <button
          onClick={() => handleToggle(item.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-accent text-white transition-colors hover:bg-accent/80"
          aria-label={`Uncheck ${item.ingredient_name}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
        <span className="flex-1 line-through text-sm">
          {item.quantity !== null && `${formatQuantity(item.quantity)} `}
          {item.unit && `${item.unit} `}
          {item.ingredient_name}
        </span>
        <button
          onClick={() => handleDelete(item.id)}
          className="shrink-0 text-warm-gray/30 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label={`Delete ${item.ingredient_name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Shopping List</h1>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
          >
            Clear all
          </button>
        )}
      </div>

      <form onSubmit={handleAdd} className="mb-6">
        <input
          ref={inputRef}
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add an item..."
          className="w-full rounded-md border border-warm-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </form>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-warm-gray">Your shopping list is empty</p>
          <p className="mt-1 text-sm text-warm-gray/60">
            Add items above or use the + button on recipe ingredients
          </p>
        </div>
      ) : (
        <>
          {unchecked.length > 0 && (
            <ul>{unchecked.map(renderUncheckedItem)}</ul>
          )}

          {unchecked.length === 0 && checked.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-warm-gray">All done!</p>
            </div>
          )}

          {checked.length > 0 && (
            <div className="mt-4 rounded-lg border border-warm-divider">
              <button
                onClick={() => setCheckedExpanded(!checkedExpanded)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-warm-gray/60 hover:text-warm-gray transition-colors"
              >
                <span className="font-medium">
                  {checked.length} checked {checked.length === 1 ? "item" : "items"}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${checkedExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {checkedExpanded && (
                <div className="border-t border-warm-divider px-4 pb-3">
                  <ul>{checked.map(renderCheckedItem)}</ul>
                  <button
                    onClick={handleClearChecked}
                    className="mt-3 text-xs text-red-400 hover:text-red-500"
                  >
                    Clear all checked
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
