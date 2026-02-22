"use client";

import { useState } from "react";

export function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "This will permanently delete your account and all your data. This cannot be undone. Are you sure?"
    );
    if (!confirmed) return;

    const finalConfirm = window.confirm(
      "Last chance. All your recipes, ratings, and follows will be permanently deleted."
    );
    if (!finalConfirm) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Delete failed");
      }
      window.location.href = "/login";
    } catch {
      alert("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-12 border-t border-warm-border pt-8">
      <h2 className="text-sm font-normal text-red-600">Danger Zone</h2>
      <p className="mt-1 text-xs text-warm-gray">
        Permanently delete your account and all associated data.
      </p>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-normal text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isDeleting ? "Deleting account..." : "Delete Account"}
      </button>
    </div>
  );
}
