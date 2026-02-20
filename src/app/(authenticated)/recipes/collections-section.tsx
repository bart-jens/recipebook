"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ForkDot } from "@/components/logo";
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

  if (collections.length === 0 && !showCreate) return null;

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-display text-[18px] tracking-[-0.02em] text-ink">Collections</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-muted">{collections.length} total</span>
          {atLimit ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] px-1.5 py-0.5 border border-border text-ink-muted">5/5</span>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-2.5 py-1.5 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
            >
              New
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-4 border border-border p-4 space-y-3">
          <input
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="block w-full bg-transparent border-b-2 border-ink pb-1.5 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent outline-none transition-colors"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="block w-full bg-transparent border-b border-border pb-1.5 text-[13px] font-light text-ink placeholder:text-ink-muted focus:border-accent outline-none transition-colors"
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !newName.trim()}
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 bg-accent text-white hover:bg-[#6D360F] transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setError(null); }}
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {collections.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {collections.map((collection) => (
            <div key={collection.id} className="group relative shrink-0 w-[140px]">
              {deletingId === collection.id ? (
                <div className="border border-red-200 bg-red-50 p-4 text-center">
                  <p className="text-[12px] text-red-700 mb-2">Delete &ldquo;{collection.name}&rdquo;?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleDelete(collection.id)}
                      disabled={isPending}
                      className="font-mono text-[9px] uppercase tracking-[0.06em] px-2 py-1 bg-red-600 text-white disabled:opacity-50"
                    >
                      {isPending ? "..." : "Delete"}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="font-mono text-[9px] uppercase tracking-[0.06em] px-2 py-1 border border-border text-ink-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : editingId === collection.id ? (
                <div className="border border-border p-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(collection.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="block w-full bg-transparent border-b border-border pb-1 text-[13px] text-ink focus:border-accent outline-none transition-colors"
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleRename(collection.id)}
                      disabled={isPending}
                      className="font-mono text-[9px] uppercase tracking-[0.06em] text-accent hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-muted hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/recipes/collections/${collection.id}`}
                  className="block border border-border overflow-hidden transition-all hover:-translate-y-px"
                >
                  {collection.resolved_cover_url ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={collection.resolved_cover_url}
                        alt={collection.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-accent-light">
                      <ForkDot size={16} color="rgba(139,69,19,0.15)" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <h3 className="font-display text-[15px] leading-[1.2] tracking-[-0.01em] text-ink truncate">{collection.name}</h3>
                    <p className="font-mono text-[10px] text-ink-muted mt-0.5">
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
                    className="font-mono text-[9px] uppercase tracking-[0.06em] bg-white/90 px-1.5 py-0.5 text-ink-muted hover:text-accent"
                  >
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeletingId(collection.id);
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.06em] bg-white/90 px-1.5 py-0.5 text-ink-muted hover:text-red-600"
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
