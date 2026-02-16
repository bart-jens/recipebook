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
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-warm-gray">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={profile.display_name}
          required
          className="w-full rounded-md bg-warm-tag px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-warm-gray">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={profile.bio}
          placeholder="Tell people a bit about yourself..."
          className="w-full rounded-md bg-warm-tag px-3 py-2 text-sm placeholder:text-warm-gray/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-warm-gray/60">Max 300 characters</p>
      </div>

      <div className="rounded-md bg-warm-tag p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Private account</p>
            <p className="text-xs text-warm-gray">
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
              isPrivate ? "bg-accent" : "bg-warm-border"
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
          <p className="mt-2 text-xs text-amber-600">
            Switching to public will automatically approve all pending follow requests.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="rounded-md bg-warm-tag px-4 py-2 text-sm text-warm-gray hover:bg-warm-border"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
