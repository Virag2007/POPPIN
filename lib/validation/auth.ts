import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password cannot exceed 72 characters")
  .refine(
    (pwd) => Buffer.byteLength(pwd, "utf8") <= 72,
    "Password cannot exceed 72 bytes in UTF-8 encoding (bcrypt limitation)"
  );

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email address cannot exceed 255 characters")
      .toLowerCase()
      .trim(),
    password: passwordSchema,
    confirmPassword: z.string().optional(),
    name: z.string().min(1, "Name is required").max(60).optional(),
    displayName: z.string().min(1).max(60).optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email address cannot exceed 255 characters").toLowerCase().trim(),
  // For login, we enforce a generous 1024-character upper bound to prevent DoS payloads,
  // without breaking login compatibility for legacy accounts that may have registered with multi-byte or longer passwords.
  password: z.string().min(1, "Password is required").max(1024, "Password cannot exceed 1024 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email address cannot exceed 255 characters").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  token: z.string().min(4, "Verification code is required").max(64),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

