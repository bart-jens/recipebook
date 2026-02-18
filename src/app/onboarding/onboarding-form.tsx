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
          className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-warm-tag transition-all hover:ring-2 hover:ring-accent"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-warm-gray">
              {initial}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
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
          className="block text-sm font-medium text-warm-gray"
        >
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-warm-tag px-3 py-3 text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-warm-gray"
        >
          Username
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray/50">
            @
          </span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            required
            className="block w-full rounded-md bg-warm-tag py-3 pl-8 pr-3 text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="mt-1 h-5">
          {usernameStatus === "checking" && (
            <p className="text-xs text-warm-gray">Checking...</p>
          )}
          {usernameStatus === "available" && (
            <p className="text-xs text-green-600">Available</p>
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
        className="w-full rounded-md bg-cta px-4 py-3 text-base font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {isPending ? "Setting up..." : "Get started"}
      </button>
    </form>
  );
}
