"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signup } from "./actions";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultCode = searchParams.get("code") || "";

  async function handleOAuth() {
    setLoading(true);
    setError(null);
    // Store invite code in a cookie before the OAuth redirect so it survives
    // the round-trip through Apple → Supabase → /auth/callback without needing
    // query params on redirectTo (Supabase can 500 on redirectTo with query params).
    if (defaultCode) {
      document.cookie = `oauth_invite_code=${encodeURIComponent(defaultCode)}; path=/; max-age=300; SameSite=Lax`;
    }
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) {
      setError("Sign in failed. Please try again.");
      setLoading(false);
    }
  }

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

      {/* Apple sign-up */}
      <div className="animate-fade-in-up [animation-delay:150ms] [animation-fill-mode:backwards]">
        <button
          type="button"
          onClick={handleOAuth}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 bg-ink px-4 py-3 text-[14px] font-normal text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <svg width="17" height="20" viewBox="0 0 17 20" fill="none" aria-hidden="true">
            <path d="M13.769 10.598c-.022-2.268 1.857-3.368 1.94-3.42-1.059-1.548-2.705-1.76-3.289-1.783-1.396-.143-2.733.827-3.443.827-.71 0-1.8-.808-2.963-.785-1.516.023-2.916.884-3.695 2.239C.612 10.252 1.766 14.56 3.55 16.928c.893 1.262 1.95 2.673 3.337 2.622 1.344-.054 1.848-.858 3.471-.858 1.623 0 2.083.858 3.497.827 1.447-.023 2.359-1.285 3.24-2.554.027-.04.054-.08.079-.12a7.7 7.7 0 0 1-2.405-3.247ZM11.337 3.574C12.074 2.682 12.566 1.455 12.43 0c-1.147.048-2.548.777-3.314 1.65-.726.798-1.37 2.076-1.198 3.293 1.28.1 2.586-.65 3.419-1.369Z" fill="currentColor"/>
          </svg>
          Sign up with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="animate-fade-in-up flex items-center gap-3 [animation-delay:200ms] [animation-fill-mode:backwards]">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-normal text-ink-muted">or</span>
        <div className="h-px flex-1 bg-border" />
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
