// POPPIN Pure Image Transformation Utilities (Client & Server Safe)

export type TransformationPreset =
  | "avatar"
  | "thumbnail"
  | "squarePost"
  | "portraitPost"
  | "story"
  | "cover";

export interface ImageTransformationOptions {
  preset?: TransformationPreset;
  width?: number;
  height?: number;
  crop?: "fill" | "thumb" | "fit" | "scale" | "limit" | "crop";
  gravity?: "face" | "auto" | "center" | "north" | "south" | "east" | "west";
  effect?: "grayscale" | "sepia";
  rotate?: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
}

export const PRESET_CONFIGS: Record<TransformationPreset, ImageTransformationOptions> = {
  avatar: {
    width: 400,
    height: 400,
    crop: "thumb",
    gravity: "face",
    quality: "auto",
    format: "auto",
  },
  thumbnail: {
    width: 300,
    height: 300,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  },
  squarePost: {
    width: 1080,
    height: 1080,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  },
  portraitPost: {
    width: 1080,
    height: 1350,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  },
  story: {
    width: 1080,
    height: 1920,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  },
  cover: {
    width: 1600,
    height: 900,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  },
};

/**
 * Builds Cloudinary transformation string segments from options
 */
export function buildTransformationString(options: ImageTransformationOptions): string {
  const resolved: ImageTransformationOptions = {
    quality: "auto",
    format: "auto",
    ...(options.preset ? PRESET_CONFIGS[options.preset] : {}),
    ...options,
  };

  const parts: string[] = [];

  // Format & Quality
  if (resolved.format) parts.push(`f_${resolved.format}`);
  if (resolved.quality) parts.push(`q_${resolved.quality}`);

  // Crop & Dimensions
  if (resolved.crop) parts.push(`c_${resolved.crop}`);
  if (resolved.gravity) parts.push(`g_${resolved.gravity}`);
  if (resolved.width) parts.push(`w_${resolved.width}`);
  if (resolved.height) parts.push(`h_${resolved.height}`);

  // Effects & Adjustments
  if (resolved.effect === "grayscale") parts.push("e_grayscale");
  if (resolved.effect === "sepia") parts.push("e_sepia");
  if (resolved.rotate !== undefined) parts.push(`a_${resolved.rotate}`);

  return parts.join(",");
}

/**
 * Generates an optimized transformed Cloudinary URL.
 * Handles both public IDs (e.g., 'poppin/avatars/user123') and full Cloudinary URLs.
 * If a non-Cloudinary URL or local mock URL is passed, it returns the URL safely untouched.
 */
export function getTransformedImageUrl(
  imageSource: string | null | undefined,
  options: ImageTransformationOptions = {}
): string {
  if (!imageSource || imageSource.trim().length === 0) {
    return "";
  }

  const src = imageSource.trim();
  const transformSegment = buildTransformationString(options);

  // If already a full Cloudinary URL
  if (src.includes("res.cloudinary.com")) {
    const uploadIndex = src.indexOf("/image/upload/");
    if (uploadIndex === -1) {
      return src;
    }

    const beforeUpload = src.substring(0, uploadIndex + "/image/upload/".length);
    const afterUpload = src.substring(uploadIndex + "/image/upload/".length);

    // If already has transformation segment, preserve or insert
    return `${beforeUpload}${transformSegment}/${afterUpload}`;
  }

  // If this is an external or local URL (e.g. Unsplash, storage.poppin.io, dev.db)
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }

  // Treat as Cloudinary publicId
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformSegment}/${src}`;
}

/**
 * Generates a responsive srcset string for multiple screen resolutions
 */
export function getResponsiveImageSrcSet(
  imageSource: string,
  widths: number[] = [320, 640, 960, 1280, 1600],
  baseOptions: Omit<ImageTransformationOptions, "width"> = {}
): string {
  if (!imageSource || !imageSource.includes("res.cloudinary.com")) {
    return "";
  }

  return widths
    .map((w) => `${getTransformedImageUrl(imageSource, { ...baseOptions, width: w })} ${w}w`)
    .join(", ");
}
