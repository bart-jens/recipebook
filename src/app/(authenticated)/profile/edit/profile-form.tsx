"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "../actions";

export function ProfileForm({
  profile,
}: {
  profile: { display_name: string; bio: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
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
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
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
          className="w-full rounded-md border border-warm-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
          defaultValue={profile.bio}
          placeholder="Tell people a bit about yourself..."
          className="w-full rounded-md border border-warm-border px-3 py-2 text-sm placeholder:text-warm-gray/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="rounded-md border border-warm-border px-4 py-2 text-sm text-warm-gray hover:bg-warm-tag"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
