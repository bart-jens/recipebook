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
        className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
      >
        Add to Collection
      </button>
    );
  }

  return (
    <div className="rounded-md border border-warm-border bg-warm-tag p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Collections</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-warm-gray hover:text-accent"
        >
          Done
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-warm-gray">Loading...</p>
      ) : collections.length === 0 && !showCreate ? (
        <div className="text-center">
          <p className="text-sm text-warm-gray mb-2">No collections yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm font-medium text-accent hover:underline"
          >
            Create one
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-white/50"
            >
              <input
                type="checkbox"
                checked={c.contains_recipe}
                onChange={() => handleToggle(c.id, c.contains_recipe)}
                disabled={isPending}
                className="h-4 w-4 rounded border-warm-border text-accent focus:ring-accent"
              />
              <span className="text-sm">{c.name}</span>
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
            className="flex-1 rounded-md bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !newName.trim()}
            className="rounded-md bg-cta px-3 py-1 text-sm font-medium text-white hover:bg-cta-hover disabled:opacity-50"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="mt-3 text-sm font-medium text-accent hover:underline"
        >
          New Collection
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
