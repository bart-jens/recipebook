import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com";

export default async function GetTheAppPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-sm space-y-10 text-center">

        {/* Checkmark */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-ink"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-[28px] font-normal tracking-[-0.01em] text-ink">
            You&rsquo;re all set.
          </h1>
          <p className="text-[14px] font-light leading-relaxed text-ink-secondary">
            EefEats is designed for the kitchen&nbsp;—&nbsp;recipes at a glance,
            hands-free cooking mode, and quick imports wherever you are.
            Get the app to use it the way it was meant to be used.
          </p>
        </div>

        {/* App Store badge */}
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-opacity hover:opacity-75"
          aria-label="Download on the App Store"
        >
          <AppStoreBadge />
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-normal tracking-[0.04em] text-ink-muted uppercase">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Continue on web */}
        <Link
          href="/recipes"
          className="block text-[13px] font-light text-ink-muted transition-colors hover:text-ink"
        >
          Continue on web
        </Link>

      </div>
    </div>
  );
}

function AppStoreBadge() {
  return (
    <svg
      width="156"
      height="52"
      viewBox="0 0 156 52"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="156" height="52" rx="8" fill="#000" />
      <text
        x="50%"
        y="22"
        textAnchor="middle"
        fill="#fff"
        fontSize="9"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.06em"
      >
        DOWNLOAD ON THE
      </text>
      <text
        x="50%"
        y="38"
        textAnchor="middle"
        fill="#fff"
        fontSize="18"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="500"
        letterSpacing="-0.01em"
      >
        App Store
      </text>
      {/* Apple logo mark */}
      <path
        d="M22 18.5c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.8.7 2.9.7 1.2 0 2-1.1 2.8-2.2.9-1.2 1.2-2.5 1.2-2.5-.1 0-2.5-1-2.5-3.7zm-2.3-6.8c.6-.7 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.7.9 0 1.9-.6 2.6-1.2z"
        fill="#fff"
      />
    </svg>
  );
}
