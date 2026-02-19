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

  function renderItem(item: ShoppingItem) {
    const attribution = getAttribution(item.recipe_ids);
    return (
      <li
        key={item.id}
        className="group flex items-center gap-3 border-b border-warm-divider py-2.5"
      >
        <button
          onClick={() => handleToggle(item.id)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 ${
            item.is_checked
              ? "border-accent bg-accent text-white"
              : "border-warm-border hover:border-accent"
          }`}
        >
          {item.is_checked && (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </button>
        <div className={`flex-1 min-w-0 ${item.is_checked ? "opacity-50" : ""}`}>
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
            <span className={item.is_checked ? "line-through" : ""}>
              {item.ingredient_name}
            </span>
          </div>
          {attribution && (
            <p className="truncate text-xs text-warm-gray/60">from {attribution}</p>
          )}
        </div>
        <button
          onClick={() => handleDelete(item.id)}
          className="shrink-0 text-warm-gray/40 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
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
        <div className="flex gap-2">
          {checked.length > 0 && (
            <button
              onClick={handleClearChecked}
              className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
            >
              Clear checked ({checked.length})
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
            >
              Clear all
            </button>
          )}
        </div>
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
            Add items above or use &quot;Add to Shopping List&quot; on any recipe
          </p>
        </div>
      ) : (
        <>
          {unchecked.length > 0 && (
            <ul>{unchecked.map(renderItem)}</ul>
          )}
          {checked.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-warm-gray/60">
                Checked ({checked.length})
              </p>
              <ul>{checked.map(renderItem)}</ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
