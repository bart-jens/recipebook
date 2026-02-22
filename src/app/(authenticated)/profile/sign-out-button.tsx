"use client";

import { logout } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <button
      onClick={() => logout()}
      className="text-[11px] font-normal tracking-[0.02em] px-3 py-2 border border-border text-ink-muted hover:border-ink hover:text-ink transition-colors"
    >
      Sign Out
    </button>
  );
}
