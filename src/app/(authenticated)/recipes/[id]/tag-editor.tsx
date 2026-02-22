"use client";

import { useState, useTransition } from "react";
import { addTag, removeTag } from "./actions";

export function TagEditor({
  recipeId,
  tags,
}: {
  recipeId: string;
  tags: { id: string; tag: string }[];
}) {
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const tagValue = input.trim().toLowerCase();
      setInput("");
      startTransition(async () => {
        await addTag(recipeId, tagValue);
      });
    }
  }

  function handleRemove(tagId: string) {
    startTransition(async () => {
      await removeTag(tagId);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1 text-[11px] font-normal tracking-[0.02em] border border-border text-ink-muted px-2 py-0.5"
          >
            {t.tag}
            <button
              onClick={() => handleRemove(t.id)}
              className="text-ink-muted/50 hover:text-accent ml-0.5"
              disabled={isPending}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          disabled={isPending}
          className="text-[11px] font-normal tracking-[0.02em] border border-dashed border-border bg-transparent px-2 py-0.5 text-ink placeholder:text-ink-muted/40 focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
