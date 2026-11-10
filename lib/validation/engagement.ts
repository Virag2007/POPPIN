import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment content cannot exceed 2000 characters"),
  replyToCommentId: z.string().uuid("Invalid comment ID").optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment content cannot exceed 2000 characters"),
});

export const paginationQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return 20;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 1) return 20;
      return Math.min(num, 50);
    }),
});

