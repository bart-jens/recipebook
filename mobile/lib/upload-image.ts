import { supabase } from './supabase';

/**
 * Upload a recipe image from a local URI to Supabase Storage.
 * Reads the file, uploads to the recipe-images bucket, inserts
 * a recipe_images row, and updates recipes.image_url.
 */
export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  imageUri: string
): Promise<string> {
  // Read the file as a blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const extension = imageUri.includes('.png') ? 'png' : 'jpg';
  const storagePath = `${userId}/${recipeId}/${uuid}.${extension}`;
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

  const arrayBuffer = await blob.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Insert into recipe_images table
  await supabase.from('recipe_images').insert({
    recipe_id: recipeId,
    storage_path: storagePath,
    is_primary: true,
  });

  // Update recipes.image_url
  await supabase
    .from('recipes')
    .update({ image_url: publicUrl })
    .eq('id', recipeId);

  return publicUrl;
}
