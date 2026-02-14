import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">EefEats</h1>
          <p className="mt-2 text-sm text-warm-gray">
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
