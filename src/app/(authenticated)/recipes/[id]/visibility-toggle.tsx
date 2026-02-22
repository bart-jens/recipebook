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
      className={`text-[11px] font-normal tracking-[0.02em] flex items-center gap-1 transition-all active:scale-[0.94] disabled:opacity-40 ${
        isPublic
          ? "text-olive"
          : "text-ink-muted hover:text-ink"
      }`}
    >
      {isPublic ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Public
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Private
        </>
      )}
    </button>
  );
}
