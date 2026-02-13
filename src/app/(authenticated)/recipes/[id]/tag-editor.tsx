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
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1 rounded-full bg-warm-tag px-3 py-1 text-sm text-warm-gray"
          >
            {t.tag}
            <button
              onClick={() => handleRemove(t.id)}
              className="ml-0.5 text-warm-gray/50 hover:text-accent"
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
          className="rounded-full border border-dashed border-warm-border bg-transparent px-3 py-1 text-sm placeholder:text-warm-gray/40 focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
