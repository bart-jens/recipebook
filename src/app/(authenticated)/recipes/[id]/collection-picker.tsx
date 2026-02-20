"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getCollectionsForRecipe,
  addRecipeToCollection,
  removeRecipeFromCollection,
  createCollection,
} from "../collections/actions";

interface CollectionItem {
  id: string;
  name: string;
  contains_recipe: boolean;
}

export function CollectionPicker({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getCollectionsForRecipe(recipeId).then(({ collections }) => {
        setCollections(collections);
        setLoading(false);
      });
    }
  }, [open, recipeId]);

  function handleToggle(collectionId: string, currentlyContains: boolean) {
    startTransition(async () => {
      if (currentlyContains) {
        await removeRecipeFromCollection(collectionId, recipeId);
      } else {
        await addRecipeToCollection(collectionId, recipeId);
      }
      setCollections(
        collections.map((c) =>
          c.id === collectionId ? { ...c, contains_recipe: !currentlyContains } : c
        )
      );
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCollection(newName.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      // Add to collection and mark as containing this recipe
      await addRecipeToCollection(result.id!, recipeId);
      setCollections([
        ...collections,
        { id: result.id!, name: newName.trim(), contains_recipe: true },
      ]);
      setNewName("");
      setShowCreate(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted hover:text-ink transition-colors"
      >
        Add to Collection
      </button>
    );
  }

  return (
    <div className="border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted">Collections</h3>
        <button
          onClick={() => setOpen(false)}
          className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted hover:text-ink"
        >
          Done
        </button>
      </div>

      {loading ? (
        <p className="text-[13px] font-light text-ink-muted">Loading...</p>
      ) : collections.length === 0 && !showCreate ? (
        <div className="text-center">
          <p className="text-[13px] font-light text-ink-muted mb-2">No collections yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-accent hover:underline"
          >
            Create one
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {collections.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 cursor-pointer py-1.5 border-b border-dotted border-border hover:pl-1 transition-all"
            >
              <span
                className={`w-3.5 h-3.5 border-[1.5px] rounded-[2px] flex-shrink-0 relative transition-all ${
                  c.contains_recipe
                    ? "bg-accent border-accent"
                    : "border-border hover:border-accent"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleToggle(c.id, c.contains_recipe);
                }}
              >
                {c.contains_recipe && (
                  <span className="absolute left-[2.5px] top-0 w-[4px] h-[7px] border-white border-r-[1.5px] border-b-[1.5px] rotate-45" />
                )}
              </span>
              <span className="text-[13px] font-light text-ink">{c.name}</span>
            </label>
          ))}
        </div>
      )}

      {showCreate ? (
        <form onSubmit={handleCreate} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-surface px-2 py-1 text-[13px] font-light text-ink border border-border focus:outline-none focus:border-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !newName.trim()}
            className="font-mono text-[10px] uppercase tracking-[0.06em] bg-ink text-bg px-3 py-1 hover:bg-ink/80 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.06em] text-accent hover:underline"
        >
          New Collection
        </button>
      )}
      {error && <p className="mt-2 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
