import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Support — EefEats",
  description: "Get help with EefEats.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-warm-border px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Logo height={28} />
          <Link
            href="/"
            className="text-sm text-accent hover:underline"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-normal text-gray-900">Support</h1>
        <p className="mt-2 text-sm text-warm-gray">
          We&apos;re here to help.
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-gray-800">
          <section>
            <h2 className="text-lg font-normal text-gray-900">
              Contact us
            </h2>
            <p className="mt-2">
              If you have questions, feedback, or need help with your account,
              send us an email at{" "}
              <a
                href="mailto:support@eefeats.com"
                className="text-accent hover:underline"
              >
                support@eefeats.com
              </a>
              . We aim to respond within 48 hours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-gray-900">
              Common questions
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-normal text-gray-900">
                  How do I delete my account?
                </h3>
                <p className="mt-1">
                  Go to your Profile and scroll to the bottom. Tap &ldquo;Delete
                  Account&rdquo; and confirm. This permanently removes all your
                  data.
                </p>
              </div>
              <div>
                <h3 className="font-normal text-gray-900">
                  How do I import a recipe?
                </h3>
                <p className="mt-1">
                  Tap the + button and paste a URL, an Instagram link, or take a
                  photo of a recipe. EefEats will extract the recipe details
                  automatically.
                </p>
              </div>
              <div>
                <h3 className="font-normal text-gray-900">
                  Can I make my profile private?
                </h3>
                <p className="mt-1">
                  Yes. Go to Edit Profile and toggle the private account setting.
                  When private, others must request to follow you before they can
                  see your recipes and activity.
                </p>
              </div>
              <div>
                <h3 className="font-normal text-gray-900">
                  How do I request a copy of my data?
                </h3>
                <p className="mt-1">
                  Email{" "}
                  <a
                    href="mailto:privacy@eefeats.com"
                    className="text-accent hover:underline"
                  >
                    privacy@eefeats.com
                  </a>{" "}
                  and we will provide your data within 30 days.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-normal text-gray-900">
              Report an issue
            </h2>
            <p className="mt-2">
              Found a bug or something not working right? Use the &ldquo;Send
              Feedback&rdquo; button in the app, or email us at{" "}
              <a
                href="mailto:support@eefeats.com"
                className="text-accent hover:underline"
              >
                support@eefeats.com
              </a>{" "}
              with a description of the issue.
            </p>
          </section>
        </div>

        <footer className="mt-12 flex gap-4 border-t border-warm-border pt-6 text-sm text-warm-gray">
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
        </footer>
      </main>
    </div>
  );
}
