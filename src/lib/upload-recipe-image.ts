import { createClient } from "@/lib/supabase/server";

const PHOTO_LIMITS = { free: 3, premium: 10 } as const;

export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  imageBuffer: Buffer
): Promise<string> {
  const supabase = createClient();

  // Enforce photo limits based on user plan
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("user_profiles").select("plan").eq("id", userId).single(),
    supabase
      .from("recipe_images")
      .select("id", { count: "exact", head: true })
      .eq("recipe_id", recipeId)
      .eq("image_type", "user_upload"),
  ]);

  const plan = (profile?.plan || "free") as keyof typeof PHOTO_LIMITS;
  const limit = PHOTO_LIMITS[plan] ?? PHOTO_LIMITS.free;
  const currentCount = count || 0;

  if (currentCount >= limit) {
    throw new Error(
      `Photo limit reached (${currentCount}/${limit}). ${plan === "free" ? "Upgrade to Premium for more photos." : ""}`
    );
  }

  const uuid = crypto.randomUUID();
  const storagePath = `${userId}/${recipeId}/${uuid}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(storagePath, imageBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("recipe-images")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Insert into recipe_images table
  await supabase.from("recipe_images").insert({
    recipe_id: recipeId,
    storage_path: storagePath,
    is_primary: true,
    image_type: "user_upload",
  });

  // Update recipes.image_url
  await supabase
    .from("recipes")
    .update({ image_url: publicUrl })
    .eq("id", recipeId);

  return publicUrl;
}
