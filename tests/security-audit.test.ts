import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { getAuthenticatedUser } from "../lib/auth/middleware";
import { POST as registerHandler } from "../app/api/v1/auth/register/route";
import { POST as loginHandler } from "../app/api/v1/auth/login/route";
import { POST as forgotPasswordHandler } from "../app/api/v1/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "../app/api/v1/auth/reset-password/route";
import { GET as googleCallbackHandler } from "../app/api/v1/auth/google/callback/route";
import { POST as createProfileHandler } from "../app/api/v1/users/me/profile/route";
import { PUT as updateLinksHandler } from "../app/api/v1/users/me/profile/links/route";
import { checkRateLimit, resetRateLimits } from "../lib/http/rate-limit";
import { handleRouteError } from "../lib/http/response";
import { Prisma } from "@prisma/client";

function createJsonRequest(
  url: string,
  method: string,
  body?: any,
  options?: { token?: string; cookie?: string; origin?: string; referer?: string }
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options?.cookie) {
    headers.set("Cookie", `poppin_token=${options.cookie}`);
  }
  if (options?.origin) {
    headers.set("Origin", options.origin);
  }
  if (options?.referer) {
    headers.set("Referer", options.referer);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function runSecurityAuditTests() {
  console.log("--- Starting Security, Scalability & Hardening Audit Tests ---");

  // Clean test user
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { in: ["sec_audit_user@poppin.io", "attacker@poppin.io"] } },
  });

  // 1. Stored XSS Prevention via javascript: URLs
  console.log("1. Testing Stored XSS Prevention (Rejecting javascript: & data: URIs in URLs)...");
  const user = await prisma.user.create({
    data: {
      email: "sec_audit_user@poppin.io",
      tokenVersion: 1,
    },
  });
  const token = signToken({ userId: user.id, email: user.email, tokenVersion: 1 });

  // Attacker tries to inject javascript: pseudo-protocol in avatar
  const xssAvatarReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "POST",
    {
      username: "sec_test_user",
      avatar: "javascript:alert(document.cookie)",
    },
    { token }
  );
  const xssAvatarRes = await createProfileHandler(xssAvatarReq);
  assert.strictEqual(xssAvatarRes.status, 400, "Must reject javascript: in avatar URL");

  // Attacker tries to inject data: URI in links
  const validProfileReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "POST",
    {
      username: "sec_test_user",
      avatar: "https://example.com/avatar.png",
    },
    { token }
  );
  const validProfileRes = await createProfileHandler(validProfileReq);
  assert.strictEqual(validProfileRes.status, 201, "Valid https: avatar should succeed");

  const xssLinkReq = createJsonRequest(
    "/api/v1/users/me/profile/links",
    "PUT",
    {
      links: [{ title: "Malicious Site", url: "javascript:alert('xss')" }],
    },
    { token }
  );
  const xssLinkRes = await updateLinksHandler(xssLinkReq);
  assert.strictEqual(xssLinkRes.status, 400, "Must reject javascript: in external links");

  const validLinkReq = createJsonRequest(
    "/api/v1/users/me/profile/links",
    "PUT",
    {
      links: [{ title: "GitHub", url: "https://github.com/poppin" }],
    },
    { token }
  );
  const validLinkRes = await updateLinksHandler(validLinkReq);
  assert.strictEqual(validLinkRes.status, 200, "Valid https: link should succeed");

  // 2. Immediate Session Revocation on Password Reset
  console.log("2. Testing Session Revocation on Password Reset...");
  // Create password reset token
  const resetTokenRes = await forgotPasswordHandler(
    createJsonRequest("/api/v1/auth/forgot-password", "POST", { email: "sec_audit_user@poppin.io" })
  );
  const resetTokenData = await resetTokenRes.json();
  const resetToken = resetTokenData.data.resetToken;

  // Complete password reset
  const resetPassRes = await resetPasswordHandler(
    createJsonRequest("/api/v1/auth/reset-password", "POST", {
      token: resetToken,
      newPassword: "BrandNewSecurePassword123!",
    })
  );
  assert.strictEqual(resetPassRes.status, 200);

  // Now, the old token (which has tokenVersion = 1) must be rejected because DB tokenVersion is 2!
  const oldTokenReq = createJsonRequest("/api/v1/users/me/profile", "GET", undefined, { token });
  let authFailed = false;
  try {
    await getAuthenticatedUser(oldTokenReq);
  } catch (err: any) {
    authFailed = true;
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(err.code, "SESSION_REVOKED");
  }
  assert.strictEqual(authFailed, true, "Old token must be rejected after password change");

  // 3. CSRF Protection for Cookie-Based Authentication
  console.log("3. Testing CSRF Protection for Cookie-Based Requests...");
  // Login with new password to get fresh valid token
  const loginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "sec_audit_user@poppin.io",
      password: "BrandNewSecurePassword123!",
    })
  );
  const loginData = await loginRes.json();
  const freshToken = loginData.data.token;

  // An attacker site tries to forge a state-changing POST using the user's cookie
  const csrfAttackReq = createJsonRequest(
    "/api/v1/users/me/profile/skills",
    "PUT",
    { skills: ["Hacked"] },
    { cookie: freshToken, origin: "https://evil-attacker-website.com" }
  );

  let csrfBlocked = false;
  try {
    await getAuthenticatedUser(csrfAttackReq);
  } catch (err: any) {
    csrfBlocked = true;
    assert.strictEqual(err.statusCode, 403);
    assert.strictEqual(err.code, "CSRF_FORBIDDEN");
  }
  assert.strictEqual(csrfBlocked, true, "Cross-site request using cookie auth must be blocked by CSRF protection");

  // Same request with legitimate origin succeeds
  const legitOriginReq = createJsonRequest(
    "/api/v1/users/me/profile/skills",
    "PUT",
    { skills: ["TypeScript"] },
    { cookie: freshToken, origin: "http://localhost:3000" }
  );
  const legitUser = await getAuthenticatedUser(legitOriginReq);
  assert.strictEqual(legitUser.id, user.id);

  // 4. OAuth State CSRF Protection
  console.log("4. Testing OAuth State CSRF Tampering Protection...");
  const oauthTamperedReq = createJsonRequest(
    "/api/v1/auth/google/callback?code=test_google_123_testuser&state=tampered_state",
    "GET"
  );
  // Add oauth_state cookie with different value
  oauthTamperedReq.cookies.set("oauth_state", "real_secure_state_value");
  const oauthTamperedRes = await googleCallbackHandler(oauthTamperedReq);
  assert.strictEqual(oauthTamperedRes.status, 403, "Mismatched OAuth state must return 403 Forbidden");

  // 5. Rate Limiting Throttling Verification
  console.log("5. Testing Rate Limiting Throttling...");
  resetRateLimits();
  const testKey = "test_rate_limiter_client";
  const limitOpts = { windowMs: 60_000, max: 3 };

  const r1 = checkRateLimit(testKey, limitOpts);
  assert.strictEqual(r1.isAllowed, true);
  assert.strictEqual(r1.remaining, 2);

  const r2 = checkRateLimit(testKey, limitOpts);
  assert.strictEqual(r2.isAllowed, true);
  assert.strictEqual(r2.remaining, 1);

  const r3 = checkRateLimit(testKey, limitOpts);
  assert.strictEqual(r3.isAllowed, true);
  assert.strictEqual(r3.remaining, 0);

  // 4th request exceeds max
  const r4 = checkRateLimit(testKey, limitOpts);
  assert.strictEqual(r4.isAllowed, false, "4th request within window must be rate-limited");
  assert.strictEqual(r4.remaining, 0);
  assert.ok(r4.headers["Retry-After"], "Retry-After header must be present on rate-limited request");

  // 6. Concurrency & Prisma Constraint Handling (P2002 -> 409 Conflict)
  console.log("6. Testing Prisma P2002 Constraint Mapping to 409 Conflict...");
  const mockP2002Error = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (username)",
    {
      code: "P2002",
      clientVersion: "5.22.0",
      meta: { target: ["username"] },
    }
  );
  const mappedResponse = handleRouteError(mockP2002Error);
  assert.strictEqual(mappedResponse.status, 409, "P2002 error must be mapped to 409 Conflict");
  const mappedData = await mappedResponse.json();
  assert.strictEqual(mappedData.error.code, "CONFLICT");

  console.log("\n>>> ALL SECURITY, SCALABILITY & HARDENING AUDIT TESTS PASSED! <<<\n");
}

if (process.argv[1]?.includes("security-audit.test")) {
  runSecurityAuditTests().catch((err) => {
    console.error("Security audit test failure:", err);
    process.exit(1);
  });
}

