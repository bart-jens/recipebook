"use client";

import { logout } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <button
      onClick={() => logout()}
      className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-2 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
    >
      Sign Out
    </button>
  );
}
