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

  // Group unchecked items by recipe source
  function groupByRecipe(itemsList: ShoppingItem[]) {
    const groups: { recipeId: string | null; title: string | null; items: ShoppingItem[] }[] = [];
    const noRecipe: ShoppingItem[] = [];

    const recipeMap = new Map<string, ShoppingItem[]>();

    for (const item of itemsList) {
      if (!item.recipe_ids || item.recipe_ids.length === 0) {
        noRecipe.push(item);
      } else {
        // Use first recipe id as group key
        const rid = item.recipe_ids[0];
        if (!recipeMap.has(rid)) recipeMap.set(rid, []);
        recipeMap.get(rid)!.push(item);
      }
    }

    // Manual items first
    if (noRecipe.length > 0) {
      groups.push({ recipeId: null, title: null, items: noRecipe });
    }

    // Then by recipe
    Array.from(recipeMap.entries()).forEach(([rid, recipeItems]) => {
      groups.push({ recipeId: rid, title: recipeTitles[rid] || null, items: recipeItems });
    });

    return groups;
  }

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
    if (!confirm("Clear all items from the grocery list?")) return;
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

  function renderUncheckedItem(item: ShoppingItem) {
    return (
      <li
        key={item.id}
        className="group flex items-center gap-2.5 py-2 border-b border-dotted border-border cursor-pointer transition-all hover:pl-1"
        onClick={() => handleToggle(item.id)}
      >
        {/* Checkbox */}
        <span
          className="w-4 h-4 border-[1.5px] rounded-[2px] flex-shrink-0 relative transition-all duration-200 border-border hover:border-accent hover:scale-110"
        />
        {/* Ingredient name */}
        <span className="flex-1 text-[14px] font-normal text-ink">
          {item.ingredient_name}
        </span>
        {/* Amount */}
        {(item.quantity !== null || item.unit) && (
          editingId === item.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuantityEdit(item.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-baseline gap-1"
            >
              <input
                type="text"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                onBlur={() => handleQuantityEdit(item.id)}
                autoFocus
                className="w-16 border-b border-border bg-transparent px-1 py-0.5 text-[12px] font-normal tracking-[0.02em] text-ink-secondary focus:border-accent focus:outline-none"
              />
              <span className="text-[12px] font-normal tracking-[0.02em] text-ink-muted">{item.unit || ""}</span>
            </form>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(item.id);
                setEditQty(item.quantity !== null ? String(item.quantity) : "");
              }}
              className="shrink-0 text-[12px] font-normal tracking-[0.02em] text-ink-secondary hover:text-accent transition-colors"
            >
              {formatQuantity(item.quantity)} {item.unit || ""}
            </button>
          )
        )}
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          className="shrink-0 text-ink-muted/40 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
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
        className="group flex items-center gap-2.5 py-2 border-b border-dotted border-border cursor-pointer transition-all"
        onClick={() => handleToggle(item.id)}
      >
        {/* Checkbox — checked */}
        <span
          className="w-4 h-4 border-[1.5px] rounded-[2px] flex-shrink-0 relative bg-accent border-accent animate-check-pop"
        >
          <span className="absolute left-[3px] top-0 w-[5px] h-[9px] border-white border-r-[1.5px] border-b-[1.5px] rotate-45" />
        </span>
        {/* Name — strikethrough accent */}
        <span className="flex-1 text-[14px] font-normal text-ink-muted line-through decoration-accent">
          {item.ingredient_name}
        </span>
        {/* Amount — muted */}
        {(item.quantity !== null || item.unit) && (
          <span className="shrink-0 text-[12px] font-normal tracking-[0.02em] text-ink-secondary opacity-40">
            {formatQuantity(item.quantity)} {item.unit || ""}
          </span>
        )}
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          className="shrink-0 text-ink-muted/30 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label={`Delete ${item.ingredient_name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    );
  }

  const groups = groupByRecipe(unchecked);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[36px] font-light tracking-[-0.03em] text-ink">
          Grocery List
        </h1>
        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
              {unchecked.length} {unchecked.length === 1 ? "item" : "items"}
            </span>
          )}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[11px] font-normal tracking-[0.02em] text-red-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Add item input — bottom-border style */}
      <form onSubmit={handleAdd} className="mb-8">
        <input
          ref={inputRef}
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add an item..."
          className="w-full border-b-2 border-border bg-transparent py-2.5 text-[14px] font-normal placeholder:text-ink-muted focus:border-accent focus:outline-none transition-colors"
        />
      </form>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[20px] font-normal text-ink-muted">Your grocery list is empty</p>
          <p className="mt-2 text-[11px] font-normal tracking-[0.02em] text-ink-muted">
            Add items above or use the + button on recipe ingredients
          </p>
        </div>
      ) : (
        <>
          {/* Grouped unchecked items */}
          {groups.map((group, gi) => (
            <div key={group.recipeId ?? `manual-${gi}`} className="mb-6">
              {group.title && (
                <h2 className="text-[20px] font-normal text-ink mb-1">
                  {group.title}
                </h2>
              )}
              {!group.title && group.recipeId === null && groups.length > 1 && (
                <h2 className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mb-1">
                  Manual
                </h2>
              )}
              <ul className="list-none">
                {group.items.map(renderUncheckedItem)}
              </ul>
            </div>
          ))}

          {/* All done message */}
          {unchecked.length === 0 && checked.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-[20px] font-normal text-ink-muted">All done!</p>
            </div>
          )}

          {/* Checked items — collapsed section */}
          {checked.length > 0 && (
            <div className="mt-6 border-t border-border">
              <button
                onClick={() => setCheckedExpanded(!checkedExpanded)}
                className="flex w-full items-center justify-between py-3 transition-colors"
              >
                <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                  Checked ({checked.length})
                </span>
                <svg
                  className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${checkedExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {checkedExpanded && (
                <div className="pb-3">
                  <ul className="list-none">{checked.map(renderCheckedItem)}</ul>
                  <button
                    onClick={handleClearChecked}
                    className="mt-3 text-[11px] font-normal tracking-[0.02em] text-red-400 hover:text-red-500 transition-colors"
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
