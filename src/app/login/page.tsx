"use client";

import Link from "next/link";
import { useState } from "react";
import { login } from "./actions";

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
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="relative text-center">
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-accent/10" />
          <h1 className="relative animate-fade-in-up font-sans text-4xl font-semibold tracking-tight">EefEats</h1>
          <p className="relative mt-2 animate-fade-in-up text-sm text-warm-gray [animation-delay:100ms] [animation-fill-mode:backwards]">
            Sign in to your recipe collection
          </p>
        </div>
        <form action={handleSubmit} className="space-y-4">
          <div className="animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
            <label htmlFor="email" className="block text-sm font-medium text-warm-gray">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-3 text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
            <label htmlFor="password" className="block text-sm font-medium text-warm-gray">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-3 text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:backwards]">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <p className="animate-fade-in-up text-center text-sm text-warm-gray [animation-delay:500ms] [animation-fill-mode:backwards]">
          Have an invite code?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
