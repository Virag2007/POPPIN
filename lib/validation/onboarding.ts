import { z } from "zod";

export const onboardingStep1Schema = z.object({
  role: z.string().trim().min(1, "Role is required").max(100, "Role must be 100 characters or less"),
  headline: z.string().trim().min(1, "Headline is required").max(160, "Headline must be 160 characters or less"),
});

export const onboardingStep2Schema = z.object({
  skills: z.array(z.string().trim().min(1).max(50)).min(1, "At least one skill is required").max(50),
  interests: z.array(z.string().trim().min(1).max(50)).min(1, "At least one interest is required").max(50),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
