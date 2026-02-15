import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;

/**
 * Downloads an external image, resizes to max 1200px wide, converts to WebP,
 * and uploads to Supabase Storage. Returns the public URL.
 */
export async function rehostImage(
  externalUrl: string,
  userId: string,
  recipeId: string
): Promise<string> {
  // Download the image
  const response = await fetch(externalUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RecipeBook/1.0)",
      Accept: "image/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image (status ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Resize and convert to WebP
  const processed = await sharp(buffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Upload to Supabase Storage
  const supabase = createClient();
  const storagePath = `${userId}/${recipeId}/${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(storagePath, processed, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("recipe-images")
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}
