import assert from "node:assert";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { getAuthenticatedUser } from "../lib/auth/middleware";
import { POST as registerHandler } from "../app/api/v1/auth/register/route";
import { POST as loginHandler } from "../app/api/v1/auth/login/route";
import { POST as logoutHandler } from "../app/api/v1/auth/logout/route";
import { POST as forgotPasswordHandler } from "../app/api/v1/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "../app/api/v1/auth/reset-password/route";
import { GET as googleCallbackHandler } from "../app/api/v1/auth/google/callback/route";
import { POST as createProfileHandler } from "../app/api/v1/users/me/profile/route";
import { PUT as updateLinksHandler } from "../app/api/v1/users/me/profile/links/route";
import { GET as getPublicProfileHandler } from "../app/api/v1/profiles/[username]/route";
import { GET as getFollowersHandler } from "../app/api/v1/users/[userId]/followers/route";
import { GET as getFollowingHandler } from "../app/api/v1/users/[userId]/following/route";
import { checkRateLimit, resetRateLimits } from "../lib/http/rate-limit";
import { handleRouteError } from "../lib/http/response";
import { AuthService } from "../services/auth.service";
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

  // 7. Password Security: 72-Byte Bcrypt Boundary & Unicode Validation
  console.log("7. Testing Bcrypt 72-Byte Boundary & Unicode Input Validation...");
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "unicode_overflow@poppin.io",
          "valid_unicode@poppin.io",
          "private_pat@poppin.io",
          "non_follower_ned@poppin.io",
          "follower_fran@poppin.io",
          "blocked_ben@poppin.io",
        ],
      },
    },
  });

  // 20 emojis: 20 characters in JS, but 80 bytes in UTF-8 (exceeds bcrypt's 72-byte limit)
  const unicodeOverflowPassword = "🔥".repeat(20);
  assert.ok(unicodeOverflowPassword.length <= 72, "Char length is under 72");
  assert.ok(Buffer.byteLength(unicodeOverflowPassword, "utf8") > 72, "Byte length exceeds 72");

  const overflowRegisterReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "unicode_overflow@poppin.io",
    password: unicodeOverflowPassword,
  });
  const overflowRegisterRes = await registerHandler(overflowRegisterReq);
  assert.strictEqual(overflowRegisterRes.status, 400, "Must reject passwords exceeding 72 bytes in UTF-8");
  const overflowRegisterData = await overflowRegisterRes.json();
  assert.strictEqual(overflowRegisterData.error.code, "VALIDATION_ERROR");

  // Valid Unicode password within 72 bytes
  const validUnicodePassword = "Pass🔥1234!"; // 11 bytes in UTF-8
  assert.ok(Buffer.byteLength(validUnicodePassword, "utf8") <= 72);
  const validUnicodeRegisterReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "valid_unicode@poppin.io",
    password: validUnicodePassword,
  });
  const validUnicodeRegisterRes = await registerHandler(validUnicodeRegisterReq);
  assert.strictEqual(validUnicodeRegisterRes.status, 201, "Valid UTF-8 password <= 72 bytes should succeed");

  await prisma.user.update({
    where: { email: "valid_unicode@poppin.io" },
    data: { isEmailVerified: true },
  });

  // Login compatibility: 80-char password in login schema doesn't fail with schema 400
  const legacyLoginReq = createJsonRequest("/api/v1/auth/login", "POST", {
    email: "valid_unicode@poppin.io",
    password: "A".repeat(80),
  });
  const legacyLoginRes = await loginHandler(legacyLoginReq);
  assert.strictEqual(legacyLoginRes.status, 401, "Should reach authentication failure (401), not schema error (400)");

  // 8. Session Invalidation on Logout
  console.log("8. Testing Session Invalidation on Logout...");
  const logoutUserReq = createJsonRequest("/api/v1/auth/login", "POST", {
    email: "valid_unicode@poppin.io",
    password: validUnicodePassword,
  });
  const logoutUserRes = await loginHandler(logoutUserReq);
  const logoutUserData = await logoutUserRes.json();
  const logoutUserToken = logoutUserData.data.token;

  // Verify token works before logout
  const preLogoutCheckReq = createJsonRequest("/api/v1/users/me/profile", "GET", undefined, { token: logoutUserToken });
  const preLogoutUser = await getAuthenticatedUser(preLogoutCheckReq);
  assert.ok(preLogoutUser, "User must be authenticated before logout");

  // Perform logout
  const doLogoutReq = createJsonRequest("/api/v1/auth/logout", "POST", undefined, { token: logoutUserToken });
  const doLogoutRes = await logoutHandler(doLogoutReq);
  assert.strictEqual(doLogoutRes.status, 200, "Logout should succeed");

  // Old token must now be rejected because tokenVersion was incremented
  let postLogoutRevoked = false;
  try {
    const postLogoutCheckReq = createJsonRequest("/api/v1/users/me/profile", "GET", undefined, { token: logoutUserToken });
    await getAuthenticatedUser(postLogoutCheckReq);
  } catch (err: any) {
    postLogoutRevoked = true;
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(err.code, "SESSION_REVOKED");
  }
  assert.strictEqual(postLogoutRevoked, true, "Old token must be rejected after logout (SESSION_REVOKED)");

  // 9. Password Reset: Hashing at Rest, Production Non-Exposure & Concurrent Single-Use
  console.log("9. Testing Password Reset Token Hashing, Production Non-Exposure & Concurrency...");
  // Test non-exposure in production mode
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = "production";
    const prodForgotRes = await AuthService.forgotPassword("valid_unicode@poppin.io");
    assert.strictEqual((prodForgotRes as any).resetToken, undefined, "resetToken must NEVER be in production response");
    assert.ok(prodForgotRes.message.includes("password reset instructions"));
  } finally {
    (process.env as any).NODE_ENV = originalEnv;
  }

  // Request new reset token in dev/test mode to get raw token
  const forgotRes = await forgotPasswordHandler(
    createJsonRequest("/api/v1/auth/forgot-password", "POST", { email: "valid_unicode@poppin.io" })
  );
  const forgotData = await forgotRes.json();
  const rawResetToken = forgotData.data.resetToken;
  assert.ok(rawResetToken, "Raw token returned in dev/test environment");

  // Verify DB stores SHA-256 hash, not raw token
  const expectedHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");
  const storedRecord = await prisma.passwordResetToken.findFirst({
    where: { token: expectedHash, used: false },
  });
  assert.ok(storedRecord, "Database must store the SHA-256 hash of the reset token");
  assert.notStrictEqual(storedRecord.token, rawResetToken, "Raw token must NEVER be stored in the database");

  // Test Anti-Enumeration: forgot-password response for non-existent email is identical
  const nonExistentForgotRes = await forgotPasswordHandler(
    createJsonRequest("/api/v1/auth/forgot-password", "POST", { email: "non_existent_random_user_99@poppin.io" })
  );
  const nonExistentData = await nonExistentForgotRes.json();
  assert.strictEqual(nonExistentForgotRes.status, 200);
  assert.strictEqual(
    nonExistentData.data.message,
    forgotData.data.message,
    "Forgot-password message must be identical for existing and non-existing accounts"
  );

  // Test Concurrent Reset Requests: token can only be consumed once even under simultaneous requests
  // Setup an existing active session before reset to verify session revocation
  const preResetUser = await prisma.user.findUnique({ where: { email: "valid_unicode@poppin.io" } });
  assert.ok(preResetUser);
  const activeSessionToken = signToken({
    userId: preResetUser.id,
    email: preResetUser.email,
    tokenVersion: preResetUser.tokenVersion,
  });
  // Verify active session works prior to reset
  const preResetSessionCheck = await getAuthenticatedUser(
    createJsonRequest("/api/v1/users/me/profile", "GET", undefined, { token: activeSessionToken })
  );
  assert.strictEqual(preResetSessionCheck.id, preResetUser.id);

  const concurrentReq1 = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: rawResetToken,
    newPassword: "ConcurrentNewPassword1!",
  });
  const concurrentReq2 = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: rawResetToken,
    newPassword: "ConcurrentNewPassword2!",
  });

  const [res1, res2] = await Promise.all([
    resetPasswordHandler(concurrentReq1),
    resetPasswordHandler(concurrentReq2),
  ]);

  // 1. Verify exactly one succeeds and one fails
  const statuses = [res1.status, res2.status].sort();
  assert.deepStrictEqual(statuses, [200, 400], "Exactly one concurrent reset request must succeed (200) and the other must fail (400)");

  // 2. Verify the failed request receives INVALID_RESET_TOKEN
  const failedRes = res1.status === 400 ? res1 : res2;
  const failedData = await failedRes.json();
  assert.strictEqual(failedData.error.code, "INVALID_RESET_TOKEN", "Failed concurrent request must receive INVALID_RESET_TOKEN");

  // 3. Verify old password no longer works after successful reset
  const oldPassLoginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "valid_unicode@poppin.io",
      password: validUnicodePassword,
    })
  );
  assert.strictEqual(oldPassLoginRes.status, 401, "Old password must no longer work after password reset");

  // 4. Verify new winning password works
  const winningPassword = res1.status === 200 ? "ConcurrentNewPassword1!" : "ConcurrentNewPassword2!";
  const newPassLoginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "valid_unicode@poppin.io",
      password: winningPassword,
    })
  );
  assert.strictEqual(newPassLoginRes.status, 200, "New password must succeed on login");

  // 5. Verify existing sessions are revoked (tokenVersion incremented)
  let sessionRevokedAfterReset = false;
  try {
    await getAuthenticatedUser(
      createJsonRequest("/api/v1/users/me/profile", "GET", undefined, { token: activeSessionToken })
    );
  } catch (err: any) {
    sessionRevokedAfterReset = true;
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(err.code, "SESSION_REVOKED");
  }
  assert.strictEqual(sessionRevokedAfterReset, true, "Existing sessions must be revoked after password reset");

  // 10. Privacy & Authorization: Private Profiles & Redaction
  console.log("10. Testing Private Profile Shielding Across Viewer Scenarios...");
  // Create Private User (Pat)
  const privateUser = await prisma.user.create({
    data: {
      email: "private_pat@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "private_pat",
          displayName: "Private Pat",
          bio: "Super confidential secret bio",
          location: "Secret City",
          coverImage: "https://example.com/cover.jpg",
          skills: JSON.stringify(["Secret Agent", "Stealth"]),
          interests: JSON.stringify(["Crypto"]),
          links: JSON.stringify([{ title: "Secret Site", url: "https://secret.io" }]),
        },
      },
      privacySettings: {
        create: {
          isPrivate: true,
        },
      },
    },
  });
  const patToken = signToken({ userId: privateUser.id, email: privateUser.email, tokenVersion: 1 });

  // Create Non-Follower (Ned)
  const nonFollowerUser = await prisma.user.create({
    data: { email: "non_follower_ned@poppin.io", tokenVersion: 1 },
  });
  const nedToken = signToken({ userId: nonFollowerUser.id, email: nonFollowerUser.email, tokenVersion: 1 });

  // Create Follower (Fran)
  const followerUser = await prisma.user.create({
    data: { email: "follower_fran@poppin.io", tokenVersion: 1 },
  });
  const franToken = signToken({ userId: followerUser.id, email: followerUser.email, tokenVersion: 1 });
  // Fran follows Pat
  await prisma.follow.create({
    data: { followerId: followerUser.id, followingId: privateUser.id },
  });

  // Scenario A: Anonymous User views Private Pat
  const anonViewReq = createJsonRequest("/api/v1/profiles/private_pat", "GET");
  const anonViewRes = await getPublicProfileHandler(anonViewReq, {
    params: Promise.resolve({ username: "private_pat" }),
  });
  assert.ok(anonViewRes.status === 401 || anonViewRes.status === 200);
  if (anonViewRes.status === 200) {
    const anonData = await anonViewRes.json();
    assert.strictEqual(anonData.data.isPrivate, true);
    assert.strictEqual(anonData.data.bio, null, "Bio must be shielded for anonymous user");
    assert.strictEqual(anonData.data.location, null, "Location must be shielded");
    assert.strictEqual(anonData.data.coverImage, null, "Cover image must be shielded");
    assert.deepStrictEqual(anonData.data.skills, [], "Skills must be empty array");
    assert.deepStrictEqual(anonData.data.links, [], "Links must be empty array");
  }

  // Scenario B: Non-Follower Ned views Private Pat
  const nedViewReq = createJsonRequest("/api/v1/profiles/private_pat", "GET", undefined, { token: nedToken });
  const nedViewRes = await getPublicProfileHandler(nedViewReq, {
    params: Promise.resolve({ username: "private_pat" }),
  });
  assert.strictEqual(nedViewRes.status, 200);
  const nedData = await nedViewRes.json();
  assert.strictEqual(nedData.data.bio, null, "Bio must be shielded for non-follower");
  assert.deepStrictEqual(nedData.data.skills, [], "Skills must be shielded for non-follower");

  // Scenario C: Non-Follower Ned attempts to view Pat's followers & following
  const nedFollowersReq = createJsonRequest(
    `/api/v1/users/${privateUser.id}/followers`,
    "GET",
    undefined,
    { token: nedToken }
  );
  const nedFollowersRes = await getFollowersHandler(nedFollowersReq, {
    params: Promise.resolve({ userId: privateUser.id }),
  });
  assert.strictEqual(nedFollowersRes.status, 403, "Non-follower must be forbidden from viewing private followers");

  const nedFollowingReq = createJsonRequest(
    `/api/v1/users/${privateUser.id}/following`,
    "GET",
    undefined,
    { token: nedToken }
  );
  const nedFollowingRes = await getFollowingHandler(nedFollowingReq, {
    params: Promise.resolve({ userId: privateUser.id }),
  });
  assert.strictEqual(nedFollowingRes.status, 403, "Non-follower must be forbidden from viewing private following");

  // Scenario D: Confirmed Follower Fran views Private Pat
  const franViewReq = createJsonRequest("/api/v1/profiles/private_pat", "GET", undefined, { token: franToken });
  const franViewRes = await getPublicProfileHandler(franViewReq, {
    params: Promise.resolve({ username: "private_pat" }),
  });
  assert.strictEqual(franViewRes.status, 200);
  const franData = await franViewRes.json();
  assert.strictEqual(franData.data.bio, "Super confidential secret bio", "Follower can view bio");
  assert.strictEqual(franData.data.location, "Secret City", "Follower can view location");
  assert.deepStrictEqual(franData.data.skills, ["Secret Agent", "Stealth"], "Follower can view skills");

  // Follower Fran can view Pat's followers
  const franFollowersReq = createJsonRequest(
    `/api/v1/users/${privateUser.id}/followers`,
    "GET",
    undefined,
    { token: franToken }
  );
  const franFollowersRes = await getFollowersHandler(franFollowersReq, {
    params: Promise.resolve({ userId: privateUser.id }),
  });
  assert.strictEqual(franFollowersRes.status, 200, "Confirmed follower can view followers list");

  // Scenario E: Owner Pat views own profile
  const patOwnReq = createJsonRequest("/api/v1/profiles/private_pat", "GET", undefined, { token: patToken });
  const patOwnRes = await getPublicProfileHandler(patOwnReq, {
    params: Promise.resolve({ username: "private_pat" }),
  });
  assert.strictEqual(patOwnRes.status, 200);
  const patData = await patOwnRes.json();
  assert.strictEqual(patData.data.bio, "Super confidential secret bio", "Owner can view own bio");

  // 11. Bidirectional Block Enforcement
  console.log("11. Testing Bidirectional Block Enforcement...");
  // Create User Blocked (Ben)
  const blockedBen = await prisma.user.create({
    data: {
      email: "blocked_ben@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "blocked_ben" } },
    },
  });
  const benToken = signToken({ userId: blockedBen.id, email: blockedBen.email, tokenVersion: 1 });

  // Direction 1: Pat blocks Ben
  await prisma.block.create({
    data: { blockerId: privateUser.id, blockedId: blockedBen.id },
  });

  // Blocked Ben tries to view Pat's profile -> returns 404 (pretends not found)
  const benViewsPatReq = createJsonRequest("/api/v1/profiles/private_pat", "GET", undefined, { token: benToken });
  const benViewsPatRes = await getPublicProfileHandler(benViewsPatReq, {
    params: Promise.resolve({ username: "private_pat" }),
  });
  assert.strictEqual(benViewsPatRes.status, 404, "Blocked user viewing blocker profile must get 404");

  // Blocked Ben tries to view Pat's followers -> returns 403
  const benViewsPatFollowersReq = createJsonRequest(
    `/api/v1/users/${privateUser.id}/followers`,
    "GET",
    undefined,
    { token: benToken }
  );
  const benViewsPatFollowersRes = await getFollowersHandler(benViewsPatFollowersReq, {
    params: Promise.resolve({ userId: privateUser.id }),
  });
  assert.strictEqual(benViewsPatFollowersRes.status, 403, "Blocked user viewing blocker followers must get 403");

  // Direction 2: Blocker Pat tries to view Ben's profile -> also restricted with 404
  const patViewsBenReq = createJsonRequest("/api/v1/profiles/blocked_ben", "GET", undefined, { token: patToken });
  const patViewsBenRes = await getPublicProfileHandler(patViewsBenReq, {
    params: Promise.resolve({ username: "blocked_ben" }),
  });
  assert.strictEqual(patViewsBenRes.status, 404, "Blocker viewing blocked user profile must get 404");

  // Clean up created test accounts
  await prisma.block.deleteMany({ where: { blockerId: privateUser.id } });
  await prisma.follow.deleteMany({ where: { followingId: privateUser.id } });
  await prisma.profile.deleteMany({
    where: { username: { in: ["private_pat", "blocked_ben"] } },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "unicode_overflow@poppin.io",
          "valid_unicode@poppin.io",
          "private_pat@poppin.io",
          "non_follower_ned@poppin.io",
          "follower_fran@poppin.io",
          "blocked_ben@poppin.io",
        ],
      },
    },
  });

  console.log("\n>>> ALL SECURITY, SCALABILITY & HARDENING AUDIT TESTS PASSED! <<<\n");
}

if (process.argv[1]?.includes("security-audit.test")) {
  runSecurityAuditTests().catch((err) => {
    console.error("Security audit test failure:", err);
    process.exit(1);
  });
}

