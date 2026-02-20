"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { completeOnboarding, checkUsername } from "./actions";

function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
}

export function OnboardingForm({
  userId,
  initialDisplayName,
  initialAvatarUrl,
}: {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(suggestUsername(initialDisplayName));
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [userEditedUsername, setUserEditedUsername] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout>>();

  const validateFormat = (val: string) => /^[a-z0-9_]{3,30}$/.test(val);

  const doCheck = useCallback(
    async (val: string) => {
      if (!validateFormat(val)) {
        setUsernameStatus("invalid");
        return;
      }
      setUsernameStatus("checking");
      const result = await checkUsername(val);
      setUsernameStatus(result.available ? "available" : "taken");
    },
    []
  );

  function handleDisplayNameChange(val: string) {
    setDisplayName(val);
    if (!userEditedUsername) {
      const suggested = suggestUsername(val);
      setUsername(suggested);
      if (suggested.length >= 3) {
        clearTimeout(checkTimer.current);
        checkTimer.current = setTimeout(() => doCheck(suggested), 400);
      } else {
        setUsernameStatus("idle");
      }
    }
  }

  function handleUsernameChange(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    setUsername(cleaned);
    setUserEditedUsername(true);
    clearTimeout(checkTimer.current);
    if (cleaned.length >= 3) {
      checkTimer.current = setTimeout(() => doCheck(cleaned), 400);
    } else {
      setUsernameStatus(cleaned.length > 0 ? "invalid" : "idle");
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${Date.now()}.${file.name.split(".").pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      setAvatarUrl(publicUrl);
    } catch {
      setError("Failed to upload photo");
    }
    setUploading(false);
  }

  function handleSubmit(formData: FormData) {
    formData.set("displayName", displayName);
    formData.set("username", username);
    if (avatarUrl) formData.set("avatarUrl", avatarUrl);

    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if (result?.error) setError(result.error);
    });
  }

  const initial = displayName ? displayName[0].toUpperCase() : "?";
  const canSubmit =
    displayName.trim().length > 0 &&
    validateFormat(username) &&
    usernameStatus !== "taken" &&
    usernameStatus !== "checking" &&
    !isPending &&
    !uploading;

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface-alt transition-all hover:ring-2 hover:ring-accent"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-2xl text-ink-secondary">
              {initial}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 font-mono text-[10px] uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? "Uploading..." : "Upload"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-ink-secondary"
        >
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          required
          className="block w-full border-b-2 border-ink bg-transparent px-0 py-3 font-body text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-ink-secondary"
        >
          Username
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute bottom-3 left-0 text-ink-muted">
            @
          </span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            required
            className="block w-full border-b-2 border-ink bg-transparent py-3 pl-5 pr-0 font-body text-base text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div className="mt-1 h-5">
          {usernameStatus === "checking" && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Checking...</p>
          )}
          {usernameStatus === "available" && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-olive">Available</p>
          )}
          {usernameStatus === "taken" && (
            <p className="text-xs text-red-600">Already taken</p>
          )}
          {usernameStatus === "invalid" && username.length > 0 && (
            <p className="text-xs text-red-600">
              3-30 characters, lowercase letters, numbers, and underscores
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Setting up..." : "Get started"}
      </button>
    </form>
  );
}
