import crypto from "crypto";

export const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Generate a cryptographically secure 6-digit numeric OTP code.
 */
export function generateNumericOTP(): string {
  // crypto.randomInt is cryptographically secure and avoids modulo bias
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Hash an OTP using SHA-256 for secure storage in the database.
 */
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Securely verify an input OTP against a stored hash (or legacy raw string).
 */
export function verifyOTP(inputOtp: string, storedHashOrRaw: string): boolean {
  if (!inputOtp || !storedHashOrRaw) return false;
  const inputTrimmed = inputOtp.trim();

  // If stored value is a 64-char hex SHA-256 hash
  if (storedHashOrRaw.length === 64 && /^[0-9a-fA-F]+$/.test(storedHashOrRaw)) {
    const inputHash = hashOTP(inputTrimmed);
    try {
      const a = Buffer.from(inputHash, "utf8");
      const b = Buffer.from(storedHashOrRaw, "utf8");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  // Fallback for legacy raw codes stored before hashing was introduced
  try {
    const a = Buffer.from(inputTrimmed, "utf8");
    const b = Buffer.from(storedHashOrRaw, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

