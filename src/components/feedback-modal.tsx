"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  sourceScreen?: string;
}

export default function FeedbackButton({ sourceScreen }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function handleClose() {
    setOpen(false);
    setMessage("");
    setSent(false);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message: message.trim(),
      platform: "web",
      source_screen: sourceScreen ?? null,
    });
    setLoading(false);

    if (!error) {
      setSent(true);
      setTimeout(handleClose, 1500);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-secondary transition-colors hover:border-ink hover:text-ink"
      >
        Send Feedback
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="w-full max-w-md border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">Send Feedback</h2>
            <button
              onClick={handleClose}
              className="font-mono text-[10px] uppercase tracking-widest text-ink-secondary hover:text-ink"
            >
              Close
            </button>
          </div>

          {sent ? (
            <p className="py-8 text-center font-body text-sm font-medium text-olive">
              Thanks for your feedback!
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Found a bug, have an idea, or just want to say hi? We read every message."
                rows={5}
                className="mb-4 w-full resize-none border-b-2 border-ink bg-transparent px-0 py-2 font-body text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="w-full bg-accent px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
