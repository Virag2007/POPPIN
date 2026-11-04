import { z } from "zod";

export const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

export const createProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(usernameRegex, "Username must be 3-30 characters and contain only letters, numbers, and underscores"),
  displayName: z.string().trim().max(100).optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
  coverImage: z.string().url("Cover image must be a valid URL").optional().or(z.literal("")),
  headline: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(100).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(100).optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
  coverImage: z.string().url("Cover image must be a valid URL").optional().or(z.literal("")),
  headline: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(100).optional(),
});

export const updateSkillsSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(50)).max(50),
});

export const updateInterestsSchema = z.object({
  interests: z.array(z.string().trim().min(1).max(50)).max(50),
});

export const linkItemSchema = z.object({
  title: z.string().trim().min(1).max(50),
  url: z.string().trim().url("Must be a valid URL"),
});

export const updateLinksSchema = z.object({
  links: z.array(linkItemSchema).max(20),
});

export const educationItemSchema = z.object({
  id: z.string().optional(),
  school: z.string().trim().min(1).max(150),
  degree: z.string().trim().max(100).optional(),
  fieldOfStudy: z.string().trim().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().trim().max(500).optional(),
});

export const updateEducationSchema = z.object({
  education: z.array(educationItemSchema).max(20),
});

export const experienceItemSchema = z.object({
  id: z.string().optional(),
  company: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(100),
  location: z.string().trim().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updateExperienceSchema = z.object({
  experience: z.array(experienceItemSchema).max(20),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSkillsInput = z.infer<typeof updateSkillsSchema>;
export type UpdateInterestsInput = z.infer<typeof updateInterestsSchema>;
export type UpdateLinksInput = z.infer<typeof updateLinksSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

