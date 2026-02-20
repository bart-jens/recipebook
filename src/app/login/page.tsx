"use client";

import Link from "next/link";
import { useState } from "react";
import { login } from "./actions";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
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
          <p className="mt-3 animate-fade-in-up font-mono text-[10px] uppercase tracking-widest text-ink-muted [animation-delay:100ms] [animation-fill-mode:backwards]">
            Sign in to your recipe collection
          </p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div className="animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
            <label htmlFor="email" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 font-body text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
            <label htmlFor="password" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 font-body text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="animate-fade-in-up pt-2 [animation-delay:400ms] [animation-fill-mode:backwards]">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <p className="animate-fade-in-up text-center font-body text-sm text-ink-secondary [animation-delay:500ms] [animation-fill-mode:backwards]">
          Have an invite code?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
