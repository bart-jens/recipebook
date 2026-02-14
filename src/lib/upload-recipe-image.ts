import { createClient } from "@/lib/supabase/server";

export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  imageBuffer: Buffer
): Promise<string> {
  const supabase = createClient();
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
  });

  // Update recipes.image_url
  await supabase
    .from("recipes")
    .update({ image_url: publicUrl })
    .eq("id", recipeId);

  return publicUrl;
}
