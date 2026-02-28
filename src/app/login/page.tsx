"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { login } from "./actions";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error") === "auth";
  const inviteRequired = searchParams.get("error") === "invite_required";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Sign in failed. Please try again.");
      setLoading(false);
    }
    // On success the browser navigates away — no need to reset loading
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex animate-fade-in-up justify-center">
            <Logo height={40} />
          </div>
          <p className="mt-3 animate-fade-in-up text-[13px] font-light text-ink-muted [animation-delay:100ms] [animation-fill-mode:backwards]">
            Sign in to your recipe collection
          </p>
        </div>

        {/* Social login */}
        <div className="animate-fade-in-up space-y-3 [animation-delay:150ms] [animation-fill-mode:backwards]">
          {(oauthError || inviteRequired || error) && (
            <p className="text-center text-[13px] text-red-600">
              {inviteRequired
                ? "You need a valid invite code to join."
                : oauthError
                ? "Sign in failed. Please try again."
                : error}
            </p>
          )}
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 border border-border bg-bg px-4 py-3 text-[14px] font-normal text-ink transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <button
            onClick={() => handleOAuth("apple")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 bg-ink px-4 py-3 text-[14px] font-normal text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <svg width="17" height="20" viewBox="0 0 17 20" fill="none" aria-hidden="true">
              <path d="M13.769 10.598c-.022-2.268 1.857-3.368 1.94-3.42-1.059-1.548-2.705-1.76-3.289-1.783-1.396-.143-2.733.827-3.443.827-.71 0-1.8-.808-2.963-.785-1.516.023-2.916.884-3.695 2.239C.612 10.252 1.766 14.56 3.55 16.928c.893 1.262 1.95 2.673 3.337 2.622 1.344-.054 1.848-.858 3.471-.858 1.623 0 2.083.858 3.497.827 1.447-.023 2.359-1.285 3.24-2.554.027-.04.054-.08.079-.12a7.7 7.7 0 0 1-2.405-3.247ZM11.337 3.574C12.074 2.682 12.566 1.455 12.43 0c-1.147.048-2.548.777-3.314 1.65-.726.798-1.37 2.076-1.198 3.293 1.28.1 2.586-.65 3.419-1.369Z" fill="currentColor"/>
            </svg>
            Sign in with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="animate-fade-in-up flex items-center gap-3 [animation-delay:200ms] [animation-fill-mode:backwards]">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-normal text-ink-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div className="animate-fade-in-up [animation-delay:250ms] [animation-fill-mode:backwards]">
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
          <div className="animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
            <label htmlFor="password" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>
          {!oauthError && error && (
            <p className="text-[13px] text-red-600">{error}</p>
          )}
          <div className="animate-fade-in-up flex justify-end [animation-delay:350ms] [animation-fill-mode:backwards]">
            <Link href="/forgot-password" className="text-[12px] font-light text-ink-muted hover:text-accent">
              Forgot password?
            </Link>
          </div>
          <div className="animate-fade-in-up pt-2 [animation-delay:400ms] [animation-fill-mode:backwards]">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink px-4 py-3 text-[14px] font-normal text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <p className="animate-fade-in-up text-center text-[13px] font-light text-ink-secondary [animation-delay:500ms] [animation-fill-mode:backwards]">
          Have an invite code?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
