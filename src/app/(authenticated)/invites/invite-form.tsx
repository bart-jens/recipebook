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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@email.com"
          required
          className="flex-1 rounded-md bg-warm-tag px-3 py-2 text-sm placeholder:text-warm-gray/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create invite"}
        </button>
      </form>

      {result?.code && (
        <div className="mt-3 rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">
            Invite created and emailed! Code:{" "}
            <span className="font-mono font-semibold">{result.code}</span>
          </p>
        </div>
      )}

      {result?.error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {result.error}
        </div>
      )}
    </div>
  );
}
