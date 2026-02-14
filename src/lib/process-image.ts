import sharp from "sharp";

export async function processImage(input: Buffer | string): Promise<Buffer> {
  let pipeline: sharp.Sharp;

  if (typeof input === "string") {
    // URL — download first
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    pipeline = sharp(Buffer.from(arrayBuffer));
  } else {
    pipeline = sharp(input);
  }

  return pipeline
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}
