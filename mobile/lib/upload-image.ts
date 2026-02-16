import { supabase } from './supabase';

const PHOTO_LIMITS = { free: 3, premium: 10 } as const;

/**
 * Upload a recipe image from a local URI to Supabase Storage.
 * Enforces per-recipe photo limits based on user plan.
 * Reads the file, uploads to the recipe-images bucket, inserts
 * a recipe_images row, and updates recipes.image_url.
 */
export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  imageUri: string
): Promise<string> {
  // Enforce photo limits based on user plan
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from('user_profiles').select('plan').eq('id', userId).single(),
    supabase
      .from('recipe_images')
      .select('id', { count: 'exact', head: true })
      .eq('recipe_id', recipeId)
      .eq('image_type', 'user_upload'),
  ]);

  const plan = (profile?.plan || 'free') as keyof typeof PHOTO_LIMITS;
  const limit = PHOTO_LIMITS[plan] ?? PHOTO_LIMITS.free;
  const currentCount = count || 0;

  if (currentCount >= limit) {
    throw new Error(
      `Photo limit reached (${currentCount}/${limit}). ${plan === 'free' ? 'Upgrade to Premium for more photos.' : ''}`
    );
  }

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
    image_type: 'user_upload',
  });

  // Update recipes.image_url
  await supabase
    .from('recipes')
    .update({ image_url: publicUrl })
    .eq('id', recipeId);

  return publicUrl;
}
