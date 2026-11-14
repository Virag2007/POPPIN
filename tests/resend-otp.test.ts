import "./load-env";
import { generateNumericOTP, hashOTP, verifyOTP, OTP_EXPIRATION_MS, RESEND_COOLDOWN_MS } from "../lib/auth/otp";
import { getFromEmail } from "../lib/email/resend";

async function runTests() {
  console.log("--- Starting Resend & OTP Unit Tests ---");

  // 1. Test OTP Generation
  const otp1 = generateNumericOTP();
  const otp2 = generateNumericOTP();
  console.log(`Generated OTP 1: ${otp1}, OTP 2: ${otp2}`);

  if (otp1.length !== 6 || !/^\d{6}$/.test(otp1)) {
    throw new Error(`OTP is not 6 numeric digits: ${otp1}`);
  }
  if (otp2.length !== 6 || !/^\d{6}$/.test(otp2)) {
    throw new Error(`OTP is not 6 numeric digits: ${otp2}`);
  }
  console.log("✔ OTP numeric 6-digit generation passed");

  // 2. Test OTP Hashing & Verification
  const hashed = hashOTP(otp1);
  if (hashed.length !== 64) {
    throw new Error(`Hash length is not 64 chars: ${hashed.length}`);
  }

  const isValidMatch = verifyOTP(otp1, hashed);
  if (!isValidMatch) {
    throw new Error("verifyOTP failed to validate matching OTP and hash");
  }

  const isInvalidMatch = verifyOTP("000000", hashed);
  if (isInvalidMatch) {
    throw new Error("verifyOTP validated incorrect OTP");
  }
  console.log("✔ OTP SHA-256 hashing and timing-safe verification passed");

  // 3. Test Constants
  if (OTP_EXPIRATION_MS !== 10 * 60 * 1000) {
    throw new Error(`Unexpected expiration: ${OTP_EXPIRATION_MS}`);
  }
  if (RESEND_COOLDOWN_MS !== 60 * 1000) {
    throw new Error(`Unexpected cooldown: ${RESEND_COOLDOWN_MS}`);
  }
  console.log("✔ Expiry (10m) and Resend cooldown (60s) constants passed");

  // 4. Test Email From Resolver
  const fromEmail = getFromEmail();
  console.log(`Resolved From Email: ${fromEmail}`);
  if (!fromEmail.includes("onboarding@resend.dev") && !fromEmail.includes("@")) {
    throw new Error(`Invalid from email: ${fromEmail}`);
  }
  console.log("✔ Resend sender address resolution passed");

  console.log("--- All Resend & OTP Unit Tests Passed! ---");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

