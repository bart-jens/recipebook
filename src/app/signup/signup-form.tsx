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
      <div className="animate-fade-in-up [animation-delay:100ms] [animation-fill-mode:backwards]">
        <Link href="/login" className="text-[12px] font-light text-ink-muted hover:text-accent">
          ← Back to sign in
        </Link>
      </div>
      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="code" value={defaultCode} />
        <div className="animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
          <label htmlFor="email" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:backwards]">
          <label htmlFor="password" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="animate-fade-in-up text-center font-body text-xs text-ink-muted [animation-delay:450ms] [animation-fill-mode:backwards]">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="animate-fade-in-up pt-2 [animation-delay:500ms] [animation-fill-mode:backwards]">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink px-4 py-3 text-[14px] font-normal text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>
      </form>
    </>
  );
}
