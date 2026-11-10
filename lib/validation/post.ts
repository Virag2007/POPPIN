import { z } from "zod";

// Protocol check to prevent Stored XSS via javascript: or data: URIs
export const safePostUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Only http:// and https:// URLs are permitted");

export const postTypeEnum = z.enum([
  "UPDATE",
  "PROJECT_SHOWCASE",
  "ACHIEVEMENT",
  "LOOKING_FOR",
]);

export const postMediaItemSchema = z.object({
  url: safePostUrlSchema,
  key: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  size: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const postLinkItemSchema = z.object({
  title: z.string().trim().min(1, "Link title cannot be empty").max(100, "Link title too long"),
  url: safePostUrlSchema,
});

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content cannot be empty")
    .max(5000, "Post content cannot exceed 5000 characters"),
  type: postTypeEnum,
  links: z.array(postLinkItemSchema).max(10, "Cannot include more than 10 links").optional().default([]),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tag cannot be empty")
        .max(30, "Tag cannot exceed 30 characters")
        .regex(/^[a-zA-Z0-9_#]+$/, "Tag must contain only letters, numbers, underscores, or hashtags")
    )
    .max(15, "Cannot include more than 15 tags")
    .optional()
    .default([]),
  media: z.array(postMediaItemSchema).max(10, "Cannot include more than 10 images").optional().default([]),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content cannot be empty")
    .max(5000, "Post content cannot exceed 5000 characters")
    .optional(),
  type: postTypeEnum.optional(),
  links: z.array(postLinkItemSchema).max(10, "Cannot include more than 10 links").optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tag cannot be empty")
        .max(30, "Tag cannot exceed 30 characters")
        .regex(/^[a-zA-Z0-9_#]+$/, "Tag must contain only letters, numbers, underscores, or hashtags")
    )
    .max(15, "Cannot include more than 15 tags")
    .optional(),
  media: z.array(postMediaItemSchema).max(10, "Cannot include more than 10 images").optional(),
});

export const uploadMediaPayloadSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required"),
  mimeType: z
    .string()
    .trim()
    .refine(
      (type) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type.toLowerCase()),
      "Only JPEG, PNG, WEBP, and GIF images are supported"
    ),
  fileData: z.string().min(1, "File content data is required"), // Base64 encoded file content
});

