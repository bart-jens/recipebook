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
            <p className="mt-2">
              We do not collect analytics, advertising identifiers, or any data
              beyond what is listed above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Legal basis for processing (GDPR)
            </h2>
            <p className="mt-2">
              If you are located in the European Economic Area (EEA), we process
              your personal data under the following legal bases:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Contract performance:</strong> processing your account
                information and recipe data is necessary to provide the EefEats
                service you signed up for.
              </li>
              <li>
                <strong>Legitimate interest:</strong> we process data related to
                social features (follows, activity feeds) to operate the
                platform as described.
              </li>
              <li>
                <strong>Consent:</strong> where required, such as for optional
                features or communications, we obtain your consent before
                processing.
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
            <p className="mt-2">
              EefEats relies on the following services to operate. These are data
              processors acting on our behalf:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase</strong> — database and authentication, hosted
                on Amazon Web Services (AWS).
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
              review them. We do not share your data with any other third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              International data transfers
            </h2>
            <p className="mt-2">
              Your data is stored on servers managed by Supabase, hosted on
              Amazon Web Services. These servers may be located in the United
              States or other regions. If you are located in the EEA, your data
              may be transferred to and processed in countries outside the EEA.
              We rely on our service providers&apos; compliance with applicable
              data transfer mechanisms to ensure your data is protected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Data storage and security
            </h2>
            <p className="mt-2">
              Data is encrypted at rest and in transit. We take reasonable
              measures to protect your information, but no method of electronic
              transmission or storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
            <p className="mt-2">
              EefEats uses essential cookies to keep you signed in and maintain
              your session. These are strictly necessary for the service to
              function and cannot be disabled. We do not use analytics,
              advertising, or tracking cookies.
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
            <p className="mt-2">
              Depending on your location, you may have the following rights
              under applicable privacy laws (including GDPR and CCPA):
            </p>
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
              <li>
                <strong>Data portability</strong> — you have the right to
                receive a copy of your data in a portable format. Data export is
                not yet available as a self-service feature. Contact us and we
                will provide your data within 30 days.
              </li>
              <li>
                <strong>Object to processing</strong> — you can object to
                processing based on legitimate interest by contacting us.
              </li>
              <li>
                <strong>Lodge a complaint</strong> — if you are in the EEA, you
                have the right to lodge a complaint with your local data
                protection supervisory authority.
              </li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information. We do not share your
              data for cross-context behavioral advertising. California
              residents: under the CCPA, you have the right to know what data we
              collect (listed above), request deletion, and opt out of the sale
              of personal information. Since we do not sell personal
              information, no opt-out is necessary.
            </p>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@eefeats.com"
                className="text-accent hover:underline"
              >
                privacy@eefeats.com
              </a>
              .
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
            <h2 className="text-lg font-semibold text-gray-900">
              Data controller
            </h2>
            <p className="mt-2">
              EefEats is the data controller responsible for your personal data.
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

        <footer className="mt-12 flex gap-4 border-t border-warm-border pt-6 text-sm text-warm-gray">
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
          <Link href="/support" className="text-accent hover:underline">
            Support
          </Link>
        </footer>
      </main>
    </div>
  );
}
