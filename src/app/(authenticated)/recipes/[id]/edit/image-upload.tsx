"use client";

import { useState, useRef } from "react";

import { createBrowserClient } from "@supabase/ssr";

export function ImageUpload({
  recipeId,
  currentImageUrl,
}: {
  recipeId: string;
  currentImageUrl: string | null;
}) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setUploading(false);
      return;
    }

    const uuid = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${user.id}/${recipeId}/${uuid}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setError("Upload failed. Please try again.");
      console.error("Storage upload failed:", uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    const { error: insertError } = await supabase.from("recipe_images").insert({
      recipe_id: recipeId,
      storage_path: storagePath,
      is_primary: true,
      image_type: "user_upload",
    });

    if (insertError) {
      console.error("Failed to insert recipe_images:", insertError);
    }

    const { error: updateError } = await supabase
      .from("recipes")
      .update({ image_url: publicUrl })
      .eq("id", recipeId);

    if (updateError) {
      setError("Photo uploaded but failed to save. Please try again.");
      console.error("Failed to update recipe image_url:", updateError);
      setUploading(false);
      return;
    }

    setImageUrl(publicUrl);
    setUploading(false);
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-normal text-warm-gray mb-2">
        Recipe Photo
      </label>
      {imageUrl ? (
        <div className="aspect-video w-full max-w-lg overflow-hidden mb-2">
          <img
            src={imageUrl}
            alt="Recipe"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border disabled:opacity-50"
      >
        {uploading
          ? "Uploading..."
          : imageUrl
            ? "Change photo"
            : "Add photo"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
