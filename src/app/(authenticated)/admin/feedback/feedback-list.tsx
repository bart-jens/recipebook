"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FeedbackItem {
  id: string;
  userName: string;
  message: string;
  platform: "web" | "mobile";
  appVersion: string | null;
  sourceScreen: string | null;
  status: "new" | "read" | "resolved";
  createdAt: string;
}

export function FeedbackList({ items: initial }: { items: FeedbackItem[] }) {
  const [items, setItems] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function updateStatus(id: string, status: "read" | "resolved") {
    const supabase = createClient();
    const { error } = await supabase
      .from("feedback")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    }
  }

  function handleExpand(item: FeedbackItem) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    if (item.status === "new") {
      updateStatus(item.id, "read");
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-warm-gray">
        No feedback yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-warm-border bg-white"
        >
          <button
            onClick={() => handleExpand(item)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <StatusBadge status={item.status} />
            <span className="min-w-0 flex-1 truncate text-sm">
              {item.message}
            </span>
            <PlatformBadge platform={item.platform} />
            <span className="shrink-0 text-xs text-warm-gray">
              {item.userName}
            </span>
            <span className="shrink-0 text-xs text-warm-gray/60">
              {formatDate(item.createdAt)}
            </span>
          </button>

          {expandedId === item.id && (
            <div className="border-t border-warm-border px-4 py-4">
              <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">
                {item.message}
              </p>
              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-gray">
                <span>From: {item.userName}</span>
                <span>Platform: {item.platform}</span>
                {item.sourceScreen && (
                  <span>Screen: {item.sourceScreen}</span>
                )}
                {item.appVersion && (
                  <span>Version: {item.appVersion}</span>
                )}
              </div>
              {item.status !== "resolved" && (
                <button
                  onClick={() => updateStatus(item.id, "resolved")}
                  className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  Mark resolved
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-accent/10 text-accent",
    read: "bg-warm-tag text-warm-gray",
    resolved: "bg-green-50 text-green-700",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || styles.read}`}
    >
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="shrink-0 rounded bg-warm-tag px-1.5 py-0.5 text-[10px] text-warm-gray">
      {platform}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
