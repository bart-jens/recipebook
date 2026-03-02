"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { forgotPassword } from "./actions";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await forgotPassword(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
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
            Reset your password
          </p>
        </div>

        {sent ? (
          <div className="animate-fade-in-up space-y-4 text-center [animation-delay:200ms] [animation-fill-mode:backwards]">
            <p className="text-[20px] font-normal text-ink">Check your email</p>
            <p className="text-[13px] font-light text-ink-secondary">
              We sent a reset link to {email}. Click it to set a new password.
            </p>
            <Link
              href="/login"
              className="mt-4 block text-[13px] font-light text-accent hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form action={(formData) => { setEmail(formData.get("email") as string); handleSubmit(formData); }} className="space-y-5">
            <div className="animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
              <label htmlFor="email" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
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
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </div>
            <p className="animate-fade-in-up text-center text-[13px] font-light text-ink-secondary [animation-delay:400ms] [animation-fill-mode:backwards]">
              <Link href="/login" className="text-accent hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
