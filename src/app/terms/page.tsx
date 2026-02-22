import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Terms of Service — EefEats",
  description: "The terms and conditions for using EefEats.",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-warm-gray">
          Effective date: February 2026
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-gray-800">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Acceptance of terms
            </h2>
            <p className="mt-2">
              By accessing or using EefEats, you agree to be bound by these
              Terms of Service. If you do not agree with any part of these terms,
              you may not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Account responsibilities
            </h2>
            <p className="mt-2">
              You are responsible for maintaining the security of your account
              credentials. You must be at least 13 years old to create an
              account. You are responsible for all activity that occurs under
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              User-generated content
            </h2>
            <p className="mt-2">
              You retain ownership of the original recipes and content you create
              on EefEats. By publishing content publicly, you grant EefEats a
              non-exclusive, worldwide, royalty-free license to display,
              distribute, and sublicense that content as part of operating the
              service.
            </p>
            <p className="mt-2">
              Private content, including imported recipes and recipes marked as
              private, is not shared with other users or displayed publicly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Imported recipes
            </h2>
            <p className="mt-2">
              Recipes you import from external sources are stored privately for
              your personal use. EefEats does not claim ownership of imported
              content. You are responsible for ensuring your use of imported
              recipes respects the copyright of the original creators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Acceptable use
            </h2>
            <p className="mt-2">You agree not to use EefEats to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Post hate speech, harassment, or abusive content.</li>
              <li>Distribute spam or unsolicited promotions.</li>
              <li>Upload illegal content or promote illegal activity.</li>
              <li>Impersonate another person or entity.</li>
              <li>
                Scrape, crawl, or use automated tools to access the service
                without permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Content moderation
            </h2>
            <p className="mt-2">
              EefEats reserves the right to remove or restrict access to any
              content that violates these terms or is otherwise harmful to the
              community, at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Account termination
            </h2>
            <p className="mt-2">
              You may delete your account at any time using the Delete Account
              feature in the app. Upon deletion, your data will be permanently
              removed. EefEats may also terminate or suspend accounts that
              violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Intellectual property
            </h2>
            <p className="mt-2">
              The EefEats name, logo, and platform design are the property of
              EefEats. You may not use our branding without written permission.
            </p>
            <p className="mt-2">
              The &ldquo;fork&rdquo; feature allows you to create a personal
              copy of a public recipe. Forked recipes include attribution to the
              original creator.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Limitation of liability
            </h2>
            <p className="mt-2">
              EefEats is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied. We do not guarantee that the service will be
              uninterrupted, error-free, or that your data will be preserved
              indefinitely. To the fullest extent permitted by law, EefEats
              shall not be liable for any indirect, incidental, or consequential
              damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Indemnification
            </h2>
            <p className="mt-2">
              You agree to indemnify and hold harmless EefEats and its
              operators from any claims, damages, or expenses arising from your
              use of the service, your content, or your violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Changes to these terms
            </h2>
            <p className="mt-2">
              EefEats may update these Terms of Service from time to time. When
              we do, we will post the revised terms on this page and update the
              effective date. Your continued use of the service after changes are
              posted constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Governing law
            </h2>
            <p className="mt-2">
              These terms are governed by and construed in accordance with the
              laws of the State of California, United States, without regard to
              conflict of law principles. Any disputes arising from these terms
              or your use of EefEats shall be subject to the exclusive
              jurisdiction of the state and federal courts located in
              California.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <p className="mt-2">
              If you have questions about these Terms of Service, contact us at{" "}
              <a
                href="mailto:legal@eefeats.com"
                className="text-accent hover:underline"
              >
                legal@eefeats.com
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-12 flex gap-4 border-t border-warm-border pt-6 text-sm text-warm-gray">
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          <Link href="/support" className="text-accent hover:underline">
            Support
          </Link>
        </footer>
      </main>
    </div>
  );
}
