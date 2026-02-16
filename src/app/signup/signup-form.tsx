"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signup } from "./actions";

export function SignupForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultCode = searchParams.get("code") || "";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <form action={handleSubmit} className="space-y-4">
        <div className="animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
          <label htmlFor="code" className="block text-sm font-medium text-warm-gray">
            Invite code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            defaultValue={defaultCode}
            placeholder="ABCD1234"
            className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-3 font-mono text-base uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
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
        <div className="animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:backwards]">
          <label htmlFor="password" className="block text-sm font-medium text-warm-gray">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-3 text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="animate-fade-in-up [animation-delay:500ms] [animation-fill-mode:backwards]">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>
      </form>
      <p className="animate-fade-in-up text-center text-sm text-warm-gray [animation-delay:600ms] [animation-fill-mode:backwards]">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
