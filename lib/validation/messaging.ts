import { z } from "zod";
import { safePostUrlSchema } from "./post";

export const createDirectConversationSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient user ID"),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content cannot be empty")
    .max(4000, "Message content cannot exceed 4000 characters"),
});

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name cannot be empty")
    .max(100, "Group name cannot exceed 100 characters"),
  avatar: safePostUrlSchema.optional().or(z.literal("")),
  memberIds: z
    .array(z.string().uuid("Invalid member user ID"))
    .min(1, "A group must include at least 1 other member")
    .max(50, "A group cannot exceed 50 members"),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name cannot be empty")
    .max(100, "Group name cannot exceed 100 characters")
    .optional(),
  avatar: safePostUrlSchema.optional().or(z.literal("")),
});

export const addGroupMemberSchema = z.object({
  userId: z.string().uuid("Invalid member user ID"),
});

