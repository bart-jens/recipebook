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
      <form action={handleSubmit} className="space-y-5">
        <div className="animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
          <label htmlFor="code" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
            Invite code (optional)
          </label>
          <input
            id="code"
            name="code"
            type="text"
            defaultValue={defaultCode}
            placeholder="ABCD1234"
            className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 font-mono text-base uppercase tracking-wider text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
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
        <div className="animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:backwards]">
          <label htmlFor="password" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 font-body text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="animate-fade-in-up pt-2 [animation-delay:500ms] [animation-fill-mode:backwards]">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>
      </form>
      <p className="animate-fade-in-up text-center font-body text-sm text-ink-secondary [animation-delay:600ms] [animation-fill-mode:backwards]">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
