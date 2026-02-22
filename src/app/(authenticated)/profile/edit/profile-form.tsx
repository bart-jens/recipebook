"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "../actions";

export function ProfileForm({
  profile,
}: {
  profile: { display_name: string; bio: string; is_private: boolean };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(profile.is_private);

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("is_private", isPrivate ? "true" : "false");
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/profile");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="display_name" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={profile.display_name}
          required
          className="w-full border-b-2 border-ink bg-transparent px-0 py-2 text-[15px] font-light text-ink focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-2 block text-[11px] font-normal tracking-[0.02em] text-ink-secondary">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={profile.bio}
          placeholder="Tell people a bit about yourself..."
          className="w-full border-b-2 border-ink bg-transparent px-0 py-2 text-[15px] font-light text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-[11px] font-normal tracking-[0.02em] text-ink-muted">Max 300 characters</p>
      </div>

      <div className="border border-border bg-surface-alt p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-normal text-ink">Private account</p>
            <p className="font-body text-xs text-ink-secondary">
              {isPrivate
                ? "Only approved followers can see your recipes and activity"
                : "Anyone can follow you and see your recipes"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={() => setIsPrivate(!isPrivate)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              isPrivate ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPrivate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {!isPrivate && profile.is_private && (
          <p className="mt-2 text-xs text-accent">
            Switching to public will automatically approve all pending follow requests.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-ink px-5 py-2 text-[14px] font-normal text-white transition-opacity hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="border border-border px-5 py-2 text-[14px] font-normal text-ink-secondary transition-colors hover:border-ink hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
