"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { resetPassword } from "./actions";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await resetPassword(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex animate-fade-in-up justify-center">
            <Logo height={40} />
          </div>
          <p className="mt-3 animate-fade-in-up text-[13px] font-light text-ink-muted [animation-delay:100ms] [animation-fill-mode:backwards]">
            Set a new password
          </p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div className="animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
            <label htmlFor="password" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              minLength={6}
              className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="animate-fade-in-up pt-2 [animation-delay:300ms] [animation-fill-mode:backwards]">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink px-4 py-3 text-[14px] font-normal text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
