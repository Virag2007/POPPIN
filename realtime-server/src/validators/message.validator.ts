import { z } from "zod";

export const attachmentSchema = z.object({
  mediaId: z.string().optional(),
  publicId: z.string().optional(),
  secureUrl: z.string().url("Attachment must have a valid secureUrl"),
  resourceType: z.string().default("image"),
  format: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().max(50 * 1024 * 1024, "Max attachment size is 50MB").optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversationId format"),
  clientMessageId: z
    .string()
    .min(1, "clientMessageId is required")
    .max(100, "clientMessageId too long"),
  content: z
    .string()
    .max(5000, "Message content cannot exceed 5000 characters")
    .default(""),
  type: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).default("TEXT"),
  attachments: z.array(attachmentSchema).max(10, "Maximum 10 attachments per message").optional(),
}).refine(
  (data) => (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0),
  {
    message: "Message must contain either text content or at least one attachment",
    path: ["content"],
  }
);

export const conversationJoinSchema = z.object({
  conversationId: z.string().uuid("Invalid conversationId format"),
});

export const markReadSchema = z.object({
  conversationId: z.string().uuid("Invalid conversationId format"),
  messageId: z.string().uuid("Invalid messageId format"),
});

export const typingSchema = z.object({
  conversationId: z.string().uuid("Invalid conversationId format"),
});

export const deleteMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversationId format"),
  messageId: z.string().uuid("Invalid messageId format"),
});

