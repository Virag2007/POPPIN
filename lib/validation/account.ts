import { z } from "zod";

export const updateAccountSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim().optional(),
});

export const updatePrivacySchema = z.object({
  isPrivate: z.boolean().optional(),
  showActivityStatus: z.boolean().optional(),
  allowTagging: z.boolean().optional(),
});

export const reportUserSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(100, "Reason must be 100 characters or less"),
  details: z.string().trim().max(1000, "Details must be 1000 characters or less").optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
export type ReportUserInput = z.infer<typeof reportUserSchema>;

