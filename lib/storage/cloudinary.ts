import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary Configuration & Server Utilities
 * Handles secure server-side configuration without leaking API secrets.
 */

// Normalized environment readers with fallbacks
export function getCloudinaryCloudName(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME
  );
}

export function getCloudinaryApiKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_API_KEY
  );
}

export function getCloudinaryApiSecret(): string | undefined {
  // Never expose to client!
  if (typeof window !== "undefined") {
    return undefined;
  }
  return process.env.CLOUDINARY_API_SECRET;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = getCloudinaryCloudName();
  const apiKey = getCloudinaryApiKey();
  const apiSecret = getCloudinaryApiSecret();
  return Boolean(cloudName && apiKey && apiSecret && apiSecret.trim().length > 0);
}

export function configureCloudinary(): void {
  if (typeof window === "undefined") {
    const cloudName = getCloudinaryCloudName();
    const apiKey = getCloudinaryApiKey();
    const apiSecret = getCloudinaryApiSecret();

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }
}

export function assertCloudinaryConfigured(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} {
  const cloudName = getCloudinaryCloudName();
  const apiKey = getCloudinaryApiKey();
  const apiSecret = getCloudinaryApiSecret();

  const missing: string[] = [];
  if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  if (!apiKey) missing.push("NEXT_PUBLIC_CLOUDINARY_API_KEY");
  if (!apiSecret || apiSecret.trim().length === 0) missing.push("CLOUDINARY_API_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Cloudinary configuration missing required environment variable(s): ${missing.join(", ")}`
    );
  }

  // Ensure Cloudinary SDK is configured with the validated credentials
  cloudinary.config({
    cloud_name: cloudName!,
    api_key: apiKey!,
    api_secret: apiSecret!,
    secure: true,
  });

  return {
    cloudName: cloudName!,
    apiKey: apiKey!,
    apiSecret: apiSecret!,
  };
}

// Initial configuration attempt on module load
configureCloudinary();

export { cloudinary };
