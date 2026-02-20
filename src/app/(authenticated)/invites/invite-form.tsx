"use client";

import { useState, useTransition } from "react";
import { createInvite } from "./actions";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ code?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setResult(null);
    startTransition(async () => {
      const res = await createInvite(email);
      setResult(res);
      if (res.code) setEmail("");
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@email.com"
          required
          className="flex-1 border-b-2 border-ink bg-transparent px-0 py-2 font-body text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border border-ink bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create invite"}
        </button>
      </form>

      {result?.code && (
        <div className="mt-3 border border-olive/20 bg-olive-light p-3">
          <p className="font-body text-sm text-olive">
            Invite created and emailed! Code:{" "}
            <span className="font-mono font-semibold">{result.code}</span>
          </p>
        </div>
      )}

      {result?.error && (
        <div className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {result.error}
        </div>
      )}
    </div>
  );
}
