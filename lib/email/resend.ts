import { Resend } from "resend";
import { AppError } from "@/lib/http/response";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AppError(
      "Resend API key is not configured. Please add RESEND_API_KEY to .env.local",
      500,
      "EMAIL_CONFIG_MISSING"
    );
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey.trim());
  }
  return resendClient;
}

export function getFromEmail(): string {
  // Reads EMAIL_FROM or RESEND_FROM_EMAIL, defaulting to Resend's free onboarding sender
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "Poppin <onboarding@resend.dev>"
  ).trim();
}

interface SendVerificationOtpOptions {
  to: string;
  otp: string;
  displayName?: string | null;
}

/**
 * Generate a responsive, dark-mode POPPIN email template for OTP verification.
 */
function buildOtpEmailHtml(otp: string, displayName?: string | null): string {
  const greeting = displayName ? `Hi ${displayName},` : "Welcome to POPPIN,";
  const formattedOtp = otp.split("").join(" ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your POPPIN Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f2f3f5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0d14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #1e1f22; border-radius: 16px; border: 1px solid #35373c; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center; border-bottom: 1px solid #2b2d31;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background-color: #5865F2; width: 40px; height: 40px; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="font-weight: 900; font-size: 20px; color: #ffffff; line-height: 40px;">P</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">POPPIN<span style="color: #5865F2;">.</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">Verify Your Email Address</h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #b5bac1; text-align: center;">
                ${greeting} please use the verification code below to confirm your account and get started on POPPIN.
              </p>

              <!-- OTP Box -->
              <div style="background-color: #111214; border: 1px solid #5865F2; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
                <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; display: block;">
                  ${formattedOtp}
                </span>
              </div>

              <!-- Security Details -->
              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #949ba4; text-align: center;">
                ⏳ This code is valid for <strong>10 minutes</strong> and can only be used once.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #80848e; text-align: center;">
                If you did not request this email, no further action is required. You can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #17181b; border-top: 1px solid #2b2d31; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #6d737e;">
                &copy; ${new Date().getFullYear()} POPPIN Platform. Crafted for builders & creators.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send a 6-digit OTP verification email via the Resend API.
 * Handles Resend test mode restrictions and surfaces clear errors.
 */
export async function sendVerificationOtpEmail({
  to,
  otp,
  displayName,
}: SendVerificationOtpOptions): Promise<{ id: string }> {
  const cleanTo = to.trim().toLowerCase();

  // In automated test environments or with test mock domains, bypass external API calls
  const isTestEnvironment =
    process.env.NODE_ENV === "test" ||
    process.env.IS_TEST_ENV === "true" ||
    cleanTo.endsWith("@example.com") ||
    cleanTo.endsWith("@test.com") ||
    cleanTo.endsWith("@poppin.io") ||
    cleanTo.endsWith("@poppin.test");

  if (isTestEnvironment) {
    return { id: `mock-test-email-id-${Date.now()}` };
  }

  const resend = getResendClient();
  const from = getFromEmail();

  const html = buildOtpEmailHtml(otp, displayName);
  const text = `Your POPPIN verification code is: ${otp}. It expires in 10 minutes. If you did not request this code, please ignore this email.`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: cleanTo,
      subject: `Your POPPIN Verification Code: ${otp}`,
      html,
      text,
    });

    if (error) {
      const errorMsg = error.message || "";
      const isRestrictedRecipient =
        errorMsg.toLowerCase().includes("testing emails to your own email address") ||
        errorMsg.toLowerCase().includes("verify your domain") ||
        errorMsg.toLowerCase().includes("resend.com/domains") ||
        error.name === "validation_error";

      if (isRestrictedRecipient) {
        throw new AppError(
          "Resend testing mode restriction: Free testing sender (onboarding@resend.dev) can only send emails to the verified Resend account owner's email address. To test, please register with your verified email address or verify a custom domain in Resend.",
          403,
          "RESEND_RESTRICTED_RECIPIENT"
        );
      }

      throw new AppError(
        `Failed to deliver verification email: ${errorMsg}`,
        502,
        "EMAIL_DELIVERY_FAILED"
      );
    }

    if (!data || !data.id) {
      throw new AppError(
        "Resend email dispatch returned an empty confirmation ID.",
        502,
        "EMAIL_DELIVERY_FAILED"
      );
    }

    return { id: data.id };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError(
      `Email service communication failed: ${message}`,
      502,
      "EMAIL_SERVICE_ERROR"
    );
  }
}

/**
 * Send a 6-digit password reset OTP email via Resend API.
 */
export async function sendPasswordResetOtpEmail({
  to,
  otp,
  displayName,
}: SendVerificationOtpOptions): Promise<{ id: string }> {
  const cleanTo = to.trim().toLowerCase();

  const isTestEnvironment =
    process.env.NODE_ENV === "test" ||
    process.env.IS_TEST_ENV === "true" ||
    cleanTo.endsWith("@example.com") ||
    cleanTo.endsWith("@test.com") ||
    cleanTo.endsWith("@poppin.io") ||
    cleanTo.endsWith("@poppin.test");

  if (isTestEnvironment) {
    return { id: `mock-reset-email-id-${Date.now()}` };
  }

  const resend = getResendClient();
  const from = getFromEmail();

  const formattedOtp = otp.split("").join(" ");
  const greeting = displayName ? `Hi ${displayName},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset Your POPPIN Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f2f3f5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0d14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #1e1f22; border-radius: 16px; border: 1px solid #35373c; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center; border-bottom: 1px solid #2b2d31;">
              <span style="font-size: 22px; font-weight: 900; color: #ffffff;">POPPIN<span style="color: #5865F2;">.</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">Password Reset Request</h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #b5bac1; text-align: center;">
                ${greeting} we received a request to reset your password. Use the 6-digit code below to set a new password:
              </p>
              <div style="background-color: #111214; border: 1px solid #5865F2; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; display: block;">
                  ${formattedOtp}
                </span>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #949ba4; text-align: center;">
                ⏳ This reset code is valid for <strong>15 minutes</strong> and can only be used once.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #80848e; text-align: center;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #17181b; border-top: 1px solid #2b2d31; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #6d737e;">
                &copy; ${new Date().getFullYear()} POPPIN Platform. Crafted for builders & creators.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Your POPPIN password reset code is: ${otp}. It expires in 15 minutes. If you did not request this, please ignore this email.`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: cleanTo,
      subject: `Your POPPIN Password Reset Code: ${otp}`,
      html,
      text,
    });

    if (error) {
      const errorMsg = error.message || "";
      const isRestrictedRecipient =
        errorMsg.toLowerCase().includes("testing emails to your own email address") ||
        errorMsg.toLowerCase().includes("verify your domain") ||
        errorMsg.toLowerCase().includes("resend.com/domains") ||
        error.name === "validation_error";

      if (isRestrictedRecipient) {
        throw new AppError(
          "Resend testing mode restriction: Free testing sender (onboarding@resend.dev) can only send emails to the verified Resend account owner's email address. To test, please request recovery using your verified email address or verify a custom domain in Resend.",
          403,
          "RESEND_RESTRICTED_RECIPIENT"
        );
      }

      throw new AppError(`Failed to deliver password reset email: ${errorMsg}`, 502, "EMAIL_DELIVERY_FAILED");
    }

    if (!data || !data.id) {
      throw new AppError("Resend email dispatch returned an empty confirmation ID.", 502, "EMAIL_DELIVERY_FAILED");
    }

    return { id: data.id };
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError(`Email service communication failed: ${message}`, 502, "EMAIL_SERVICE_ERROR");
  }
}

