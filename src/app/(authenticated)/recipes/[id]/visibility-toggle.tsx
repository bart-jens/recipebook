"use client";

import { useState } from "react";
import { toggleVisibility } from "./actions";

export function VisibilityToggle({ recipeId, isPublic: initialPublic }: { recipeId: string; isPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setIsPublic(!isPublic);
    setLoading(true);
    const result = await toggleVisibility(recipeId);
    if (result?.error) {
      setIsPublic(isPublic); // revert
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isPublic
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-warm-tag text-warm-gray hover:bg-warm-border"
      }`}
    >
      {isPublic ? "Public" : (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Private
        </span>
      )}
    </button>
  );
}
