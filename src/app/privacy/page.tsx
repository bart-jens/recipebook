import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Privacy Policy — EefEats",
  description: "How EefEats collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-warm-gray">
          Effective date: February 2026
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-gray-800">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Introduction
            </h2>
            <p className="mt-2">
              EefEats is a social recipe platform that helps you collect, share,
              and discover recipes. This Privacy Policy explains what data we
              collect, how we use it, and what rights you have regarding your
              information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              What data we collect
            </h2>
            <p className="mt-2">
              When you use EefEats, we collect the following information:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Account information:</strong> email address, display
                name, username, and profile photo.
              </li>
              <li>
                <strong>Recipe content:</strong> titles, ingredients,
                instructions, photos, and other recipe data you create or
                import.
              </li>
              <li>
                <strong>Cooking activity:</strong> ratings, cook log entries, and
                notes.
              </li>
              <li>
                <strong>Social connections:</strong> the users you follow and who
                follow you.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              How we use your data
            </h2>
            <p className="mt-2">We use your data to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Provide and operate the EefEats service, including displaying
                your recipes, profile, and activity.
              </li>
              <li>
                Enable social features such as following other users, viewing
                activity feeds, and discovering recipes.
              </li>
              <li>Improve the app and fix issues.</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Third-party services
            </h2>
            <p className="mt-2">EefEats relies on the following services:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase</strong> — database and authentication, hosted
                on AWS.
              </li>
              <li>
                <strong>Vercel</strong> — web application hosting.
              </li>
              <li>
                <strong>Apple</strong> — Sign in with Apple for authentication.
              </li>
            </ul>
            <p className="mt-2">
              These services have their own privacy policies. We encourage you to
              review them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Data storage and security
            </h2>
            <p className="mt-2">
              Your data is stored on servers managed by Supabase, hosted on
              Amazon Web Services (AWS). Data is encrypted at rest. We take
              reasonable measures to protect your information, but no method of
              electronic transmission or storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Data retention
            </h2>
            <p className="mt-2">
              We retain your data for as long as your account is active. When you
              delete your account using the in-app Delete Account feature, your
              data is permanently deleted from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Your rights
            </h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Access your data</strong> — you can view your recipes,
                profile, and activity through the app.
              </li>
              <li>
                <strong>Correct your data</strong> — you can edit your profile
                and recipes at any time.
              </li>
              <li>
                <strong>Delete your data</strong> — you can permanently delete
                your account and all associated data using the Delete Account
                feature in the app.
              </li>
            </ul>
            <p className="mt-2">
              Data export is not currently supported. If you need a copy of your
              data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Children&apos;s privacy
            </h2>
            <p className="mt-2">
              EefEats is not intended for users under the age of 13. We do not
              knowingly collect personal information from children under 13. If
              we become aware that we have collected data from a child under 13,
              we will delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Changes to this policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. When we do, we
              will post the revised policy on this page and update the effective
              date. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <p className="mt-2">
              If you have questions about this Privacy Policy or how we handle
              your data, contact us at{" "}
              <a
                href="mailto:privacy@eefeats.com"
                className="text-accent hover:underline"
              >
                privacy@eefeats.com
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-12 border-t border-warm-border pt-6 text-sm text-warm-gray">
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
        </footer>
      </main>
    </div>
  );
}
