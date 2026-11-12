import { z } from "zod";
import { safePostUrlSchema } from "./post";

export const communityCategoryEnum = z.enum([
  "Design",
  "Engineering",
  "AI & Research",
  "Founders",
  "General",
]);

export const createCommunitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Community name must be at least 2 characters")
    .max(80, "Community name cannot exceed 80 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  tagline: z.string().trim().max(160, "Tagline cannot exceed 160 characters").optional(),
  description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional(),
  category: communityCategoryEnum.default("General"),
  avatar: safePostUrlSchema.optional().or(z.literal("")),
  coverImage: safePostUrlSchema.optional().or(z.literal("")),
  rules: z.array(z.string().trim().min(1).max(300)).max(10, "Cannot add more than 10 rules").optional().default([]),
});

export const updateCommunitySchema = createCommunitySchema.partial().omit({ slug: true });

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;

