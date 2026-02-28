"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { verifyOAuthInvite, cancelOAuthSignup } from "./actions";

export default function VerifyInvitePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await verifyOAuthInvite(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    await cancelOAuthSignup();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo height={40} />
          </div>
          <h1 className="mt-6 text-[20px] font-light text-ink">
            One more step
          </h1>
          <p className="mt-2 text-[13px] font-light text-ink-muted">
            EefEats is invite-only. Enter your invite code to continue.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="code" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
              Invite code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              autoCapitalize="characters"
              autoCorrect="off"
              placeholder="XXXXXXXX"
              className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-[13px] text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink px-4 py-3 text-[14px] font-normal text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-[12px] font-light text-ink-muted hover:text-accent disabled:opacity-50"
          >
            Cancel and sign out
          </button>
        </div>
      </div>
    </div>
  );
}
