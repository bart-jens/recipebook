"use client";

import Link from "next/link";
import { useState } from "react";
import { login } from "./actions";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

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

  async function handleOAuth(provider: "google" | "apple") {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Could not connect to " + (provider === "google" ? "Google" : "Apple"));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex animate-fade-in-up justify-center">
            <Logo height={40} />
          </div>
          <p className="mt-3 animate-fade-in-up text-sm text-warm-gray [animation-delay:100ms] [animation-fill-mode:backwards]">
            Sign in to your recipe collection
          </p>
        </div>

        <div className="animate-fade-in-up space-y-3 [animation-delay:200ms] [animation-fill-mode:backwards]">
          <button
            onClick={() => handleOAuth("google")}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-warm-border bg-white px-4 py-3 text-base font-medium transition-all hover:-translate-y-px hover:shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuth("apple")}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-warm-border bg-black px-4 py-3 text-base font-medium text-white transition-all hover:-translate-y-px hover:shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="animate-fade-in-up flex items-center gap-3 [animation-delay:300ms] [animation-fill-mode:backwards]">
          <div className="h-px flex-1 bg-warm-border" />
          <span className="text-xs text-warm-gray">or</span>
          <div className="h-px flex-1 bg-warm-border" />
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:backwards]">
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
          <div className="animate-fade-in-up [animation-delay:500ms] [animation-fill-mode:backwards]">
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
          <div className="animate-fade-in-up [animation-delay:600ms] [animation-fill-mode:backwards]">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <p className="animate-fade-in-up text-center text-sm text-warm-gray [animation-delay:700ms] [animation-fill-mode:backwards]">
          Have an invite code?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
