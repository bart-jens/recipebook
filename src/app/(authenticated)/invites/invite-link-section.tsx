"use client";

import { useState } from "react";

export function InviteLinkSection({ inviteLink }: { inviteLink: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-8 border border-border p-4">
      <p className="text-[13px] font-normal text-ink mb-0.5">Share your invite link</p>
      <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mb-3">
        Anyone with this link can create an account.
      </p>
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-[12px] font-normal tracking-[0.02em] text-ink-secondary bg-surface border border-border px-3 py-2">
          {inviteLink}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 px-4 py-2 text-[12px] font-normal tracking-[0.02em] border border-border text-ink hover:border-ink transition-colors"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
