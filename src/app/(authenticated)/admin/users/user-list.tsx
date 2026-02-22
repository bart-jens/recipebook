"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "../actions";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  plan: string;
  recipeCount: number;
  createdAt: string;
}

export function UserList({ users, query }: { users: User[]; query: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    router.push(`/admin/users${value ? `?${params}` : ""}`);
  }

  function handleDelete(userId: string) {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        alert(result.error);
      }
      setConfirmId(null);
    });
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by email or name..."
        className="mb-4 w-full border-b-2 border-ink bg-transparent px-0 py-2 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
      />

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between border border-border bg-surface px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-light text-ink">{user.displayName}</p>
                <span className="shrink-0 text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                  {user.role}
                </span>
                <span className="shrink-0 text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                  {user.plan}
                </span>
              </div>
              <p className="truncate text-[11px] font-normal tracking-[0.02em] text-ink-secondary">{user.email}</p>
              <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
                {user.recipeCount} recipes &middot; joined{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            {user.role !== "admin" && (
              <div className="ml-4 shrink-0">
                {confirmId === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-normal tracking-[0.02em] text-red-600">Delete?</span>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={isPending}
                      className="bg-red-600 px-2 py-1 text-[11px] font-normal tracking-[0.02em] text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isPending ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="border border-border px-2 py-1 text-[11px] font-normal tracking-[0.02em] text-ink-secondary hover:border-ink hover:text-ink"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(user.id)}
                    className="px-2 py-1 text-[11px] font-normal tracking-[0.02em] text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <p className="py-8 text-center text-[13px] font-light text-ink-muted">No users found</p>
        )}
      </div>
    </div>
  );
}
