"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCollection, deleteCollection, renameCollection } from "./collections/actions";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  recipe_count: number;
  resolved_cover_url: string | null;
}

export function CollectionsSection({
  collections: initialCollections,
  userPlan,
  collectionCount,
}: {
  collections: Collection[];
  userPlan: string;
  collectionCount: number;
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const atLimit = userPlan === "free" && collectionCount >= 5;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCollection(newName.trim(), newDesc.trim() || undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCollections([
        { id: result.id!, name: newName.trim(), description: newDesc.trim() || null, recipe_count: 0, resolved_cover_url: null },
        ...collections,
      ]);
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
    });
  }

  function handleRename(collectionId: string) {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await renameCollection(collectionId, editName.trim());
      if (!result.error) {
        setCollections(collections.map((c) =>
          c.id === collectionId ? { ...c, name: editName.trim() } : c
        ));
        setEditingId(null);
      }
    });
  }

  function handleDelete(collectionId: string) {
    startTransition(async () => {
      const result = await deleteCollection(collectionId);
      if (!result.error) {
        setCollections(collections.filter((c) => c.id !== collectionId));
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">Collections</h2>
        {atLimit ? (
          <span className="text-xs text-warm-gray">5/5 (upgrade for more)</span>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm font-medium text-accent hover:underline"
          >
            New Collection
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-4 rounded-md bg-warm-tag p-4 space-y-3">
          <input
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="block w-full rounded-md bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="block w-full rounded-md bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !newName.trim()}
              className="rounded-md bg-cta px-4 py-1.5 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setError(null); }}
              className="rounded-md bg-warm-tag px-4 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {collections.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {collections.map((collection) => (
            <div key={collection.id} className="group relative">
              {deletingId === collection.id ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
                  <p className="text-sm text-red-700 mb-2">Delete &ldquo;{collection.name}&rdquo;?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleDelete(collection.id)}
                      disabled={isPending}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isPending ? "..." : "Delete"}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="rounded-md bg-white px-3 py-1 text-xs text-warm-gray hover:bg-warm-tag"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : editingId === collection.id ? (
                <div className="rounded-md border border-warm-border bg-warm-tag p-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(collection.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="block w-full rounded-md bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleRename(collection.id)}
                      disabled={isPending}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-warm-gray hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/recipes/collections/${collection.id}`}
                  className="block rounded-md border border-warm-border bg-warm-tag overflow-hidden transition-all hover:-translate-y-px hover:shadow-sm"
                >
                  {collection.resolved_cover_url ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={collection.resolved_cover_url}
                        alt={collection.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-accent/5">
                      <span className="text-lg font-medium text-accent/40">
                        {collection.name.slice(0, 1)}
                      </span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">{collection.name}</h3>
                    <p className="text-xs text-warm-gray">
                      {collection.recipe_count} recipe{collection.recipe_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              )}
              {!editingId && !deletingId && (
                <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingId(collection.id);
                      setEditName(collection.name);
                    }}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-warm-gray hover:text-accent shadow-sm"
                  >
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeletingId(collection.id);
                    }}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-warm-gray hover:text-red-600 shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
