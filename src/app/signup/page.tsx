import { Suspense } from "react";
import { SignupForm } from "./signup-form";
import { Logo } from "@/components/logo";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex animate-fade-in-up justify-center">
            <Logo height={40} />
          </div>
          <p className="mt-3 animate-fade-in-up font-mono text-[10px] uppercase tracking-widest text-ink-muted [animation-delay:100ms] [animation-fill-mode:backwards]">
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
