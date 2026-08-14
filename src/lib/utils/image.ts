import sharp from "sharp";
import { Logger } from "@/lib/logger";

interface CompressionResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Compresses an image to a size under 500KB (or as close as possible) without sacrificing too much quality.
 * Converts raster formats (JPEG, PNG, WebP, AVIF) to WebP for superior web optimization.
 * SVGs and GIFs are kept in their original format to preserve vectors and animations.
 */
export async function compressImage(
  buffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<CompressionResult> {
  const lowerMime = mimeType.toLowerCase();

  // If it's SVG or GIF, keep them as is (SVG is vector, GIF might be animated/play)
  if (lowerMime === "image/svg+xml" || lowerMime === "image/gif") {
    Logger.info(`Skipping compression for format: ${mimeType}`);
    return { buffer, mimeType, fileName: originalFileName };
  }

  try {
    const TARGET_SIZE_BYTES = 500 * 1024; // 500 KB target size
    let quality = 80;
    let maxWidth = 1920;

    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Determine the output filename (changing extension to .webp)
    const lastDotIndex = originalFileName.lastIndexOf(".");
    const baseName = lastDotIndex !== -1 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
    const newFileName = `${baseName}.webp`;

    Logger.info(
      `Starting image compression for ${originalFileName} (${(buffer.length / 1024).toFixed(2)} KB). Initial dimensions: ${metadata.width}x${metadata.height}`
    );

    // Initial pass: WebP, resize if wider than maxWidth, quality 80
    let pipeline = sharpInstance;
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    let compressedBuffer = await pipeline
      .webp({ quality, effort: 4 })
      .toBuffer();

    // If still larger than 500KB, progressively lower quality down to 50
    while (compressedBuffer.length > TARGET_SIZE_BYTES && quality > 50) {
      quality -= 10;
      compressedBuffer = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
    }

    // If still over 500KB, resize to 1280px max width and set quality to 60
    if (compressedBuffer.length > TARGET_SIZE_BYTES) {
      maxWidth = 1280;
      compressedBuffer = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 60, effort: 4 })
        .toBuffer();
    }

    Logger.info(
      `Successfully compressed image: ${newFileName} (${(compressedBuffer.length / 1024).toFixed(2)} KB, quality=${quality}, width=${maxWidth})`
    );

    return {
      buffer: compressedBuffer,
      mimeType: "image/webp",
      fileName: newFileName,
    };
  } catch (error) {
    Logger.error("Failed to compress image, falling back to original:", error);
    // Fall back to original file if compression fails
    return { buffer, mimeType, fileName: originalFileName };
  }
}
