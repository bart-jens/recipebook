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
          className="flex-1 rounded-md border border-warm-border px-3 py-2 text-sm placeholder:text-warm-gray/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create invite"}
        </button>
      </form>

      {result?.code && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-700">
            Invite created! Share this code:{" "}
            <span className="font-mono font-semibold">{result.code}</span>
          </p>
          <p className="mt-1 text-xs text-green-600">
            They can sign up at the login page with this code.
          </p>
        </div>
      )}

      {result?.error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {result.error}
        </div>
      )}
    </div>
  );
}
