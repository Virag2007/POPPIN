import { z } from "zod";
import { safeOptionalUrlSchema } from "./profile";

export const onboardingStep1Schema = z.object({
  displayName: z.string().trim().max(100).optional(),
  headline: z.string().trim().min(1, "Headline is required").max(160, "Headline must be 160 characters or less"),
  bio: z.string().trim().max(1000).optional(),
  role: z.string().trim().max(100).optional(),
});

export const onboardingImagesSchema = z.object({
  avatar: safeOptionalUrlSchema,
  coverImage: safeOptionalUrlSchema,
});

export const onboardingStep2Schema = z.object({
  skills: z.array(z.string().trim().min(1).max(50)).max(50).optional().default([]),
  interests: z.array(z.string().trim().min(1).max(50)).min(1, "Select at least one interest").max(50),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingImagesInput = z.infer<typeof onboardingImagesSchema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
