import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent/5 via-white to-accent/10 p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="relative text-center">
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-accent/10" />
          <h1 className="relative animate-fade-in-up font-serif text-4xl font-semibold tracking-tight">EefEats</h1>
          <p className="relative mt-2 animate-fade-in-up text-sm text-warm-gray [animation-delay:100ms] [animation-fill-mode:backwards]">
            Join with an invite code
          </p>
        </div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
