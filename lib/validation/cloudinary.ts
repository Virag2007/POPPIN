import { z } from "zod";

export const ALLOWED_UPLOAD_FOLDERS = [
  "avatars",
  "posts",
  "covers",
  "stories",
  "banners",
] as const;

export type AllowedUploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

export const ALLOWED_IMAGE_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
] as const;

export type AllowedImageFormat = (typeof ALLOWED_IMAGE_FORMATS)[number];

// 10 Megabytes in bytes
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const cloudinarySignatureRequestSchema = z.object({
  folder: z.enum(ALLOWED_UPLOAD_FOLDERS, {
    message: `Invalid upload folder. Permitted folders: ${ALLOWED_UPLOAD_FOLDERS.join(", ")}`,
  }),
});

export const cloudinaryVerifyAndSaveSchema = z.object({
  publicId: z
    .string()
    .trim()
    .min(1, "publicId is required")
    .max(300, "publicId is too long")
    .regex(/^[a-zA-Z0-9_\-\/]+$/, "publicId contains invalid characters"),
  secureUrl: z
    .string()
    .trim()
    .url("Invalid secureUrl")
    .refine((val) => {
      try {
        const u = new URL(val);
        return (
          u.protocol === "https:" &&
          (u.hostname.endsWith("cloudinary.com") || u.hostname === "storage.poppin.io")
        );
      } catch {
        return false;
      }
    }, "Only HTTPS Cloudinary URLs are allowed"),
  resourceType: z.literal("image").default("image"),
  format: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (f) => ALLOWED_IMAGE_FORMATS.includes(f as AllowedImageFormat),
      `Invalid format. Allowed formats: ${ALLOWED_IMAGE_FORMATS.join(", ")}`
    ),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().max(MAX_IMAGE_SIZE_BYTES, "Image size exceeds 10MB limit").optional(),
  folder: z.enum(ALLOWED_UPLOAD_FOLDERS),
  altText: z.string().trim().max(300, "Alt text too long").optional(),
});

export type CloudinarySignatureRequest = z.infer<typeof cloudinarySignatureRequestSchema>;
export type CloudinaryVerifyAndSaveInput = z.infer<typeof cloudinaryVerifyAndSaveSchema>;
