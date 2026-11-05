import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { AuthService } from "../services/auth.service";
import { checkOwnership } from "../lib/auth/middleware";
import { POST as registerHandler } from "../app/api/v1/auth/register/route";
import { POST as loginHandler } from "../app/api/v1/auth/login/route";
import { GET as meHandler } from "../app/api/v1/auth/me/route";
import { GET as googleHandler } from "../app/api/v1/auth/google/route";
import { GET as googleCallbackHandler } from "../app/api/v1/auth/google/callback/route";
import { POST as forgotPasswordHandler } from "../app/api/v1/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "../app/api/v1/auth/reset-password/route";
import { POST as logoutHandler } from "../app/api/v1/auth/logout/route";

function createJsonRequest(
  url: string,
  method: string,
  body?: any,
  options?: { token?: string; cookie?: string; rawBody?: string }
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options?.cookie) {
    headers.set("Cookie", `poppin_token=${options.cookie}`);
  }

  let requestBody: any = undefined;
  if (options?.rawBody !== undefined) {
    requestBody = options.rawBody;
  } else if (body !== undefined) {
    requestBody = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: requestBody,
  });
}

export async function runPhase1Tests() {
  console.log("--- Starting Comprehensive Phase 1 Tests: Authentication & Authorization ---");

  // Clean test database before running
  await prisma.passwordResetToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["alice@example.com", "bob@example.com", "googleuser@gmail.com"],
      },
    },
  });

  // 1. Register with email & password
  console.log("1. Testing Registration...");
  const regReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "alice@example.com",
    password: "Password123!",
  });
  const regRes = await registerHandler(regReq);
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 201, "Registration should return 201");
  assert.strictEqual(regData.success, true);
  assert.strictEqual(regData.data.user.email, "alice@example.com");
  assert.ok(regData.data.token, "Token should be present");

  // Verify bcrypt password hash in database (never plain text)
  const dbUser = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  assert.ok(dbUser?.passwordHash, "Password hash must exist in DB");
  assert.notStrictEqual(dbUser?.passwordHash, "Password123!", "Password must not be stored in plaintext");
  assert.ok(dbUser?.passwordHash.startsWith("$2"), "Password must be bcrypt hashed");

  // 2. Reject duplicate registration
  console.log("2. Testing Duplicate Registration Prevention...");
  const dupReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "alice@example.com",
    password: "Password123!",
  });
  const dupRes = await registerHandler(dupReq);
  const dupData = await dupRes.json();
  assert.strictEqual(dupRes.status, 409, "Duplicate registration should return 409 Conflict");
  assert.strictEqual(dupData.success, false);
  assert.strictEqual(dupData.error.code, "EMAIL_ALREADY_EXISTS");

  // 3. Validation errors on registration
  console.log("3. Testing Registration Input Validation...");
  const weakReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "bob@example.com",
    password: "short",
  });
  const weakRes = await registerHandler(weakReq);
  assert.strictEqual(weakRes.status, 400, "Short password (<8 chars) should return 400");

  const invalidEmailReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "not-an-email",
    password: "ValidPassword123!",
  });
  const invalidEmailRes = await registerHandler(invalidEmailReq);
  assert.strictEqual(invalidEmailRes.status, 400, "Invalid email format should return 400");

  // 4. Test Malformed JSON Handling
  console.log("4. Testing Malformed JSON Payload Handling...");
  const malformedReq = createJsonRequest("/api/v1/auth/register", "POST", undefined, {
    rawBody: "{ invalid json payload",
  });
  const malformedRes = await registerHandler(malformedReq);
  assert.strictEqual(malformedRes.status, 400, "Malformed JSON should return 400 Bad Request");
  const malformedData = await malformedRes.json();
  assert.strictEqual(malformedData.error.code, "INVALID_JSON");

  // 5. Login with valid credentials
  console.log("5. Testing Valid Login...");
  const loginReq = createJsonRequest("/api/v1/auth/login", "POST", {
    email: "alice@example.com",
    password: "Password123!",
  });
  const loginRes = await loginHandler(loginReq);
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, "Valid login should return 200");
  assert.strictEqual(loginData.success, true);
  assert.ok(loginData.data.token, "Login should return JWT token");
  const authToken = loginData.data.token;

  // 6. Login with invalid password
  console.log("6. Testing Invalid Password Login...");
  const badLoginReq = createJsonRequest("/api/v1/auth/login", "POST", {
    email: "alice@example.com",
    password: "WrongPassword!",
  });
  const badLoginRes = await loginHandler(badLoginReq);
  assert.strictEqual(badLoginRes.status, 401, "Invalid password should return 401");

  // 7. Login with non-existent email
  console.log("7. Testing Non-Existent Email Login...");
  const noUserLoginReq = createJsonRequest("/api/v1/auth/login", "POST", {
    email: "nobody@example.com",
    password: "Password123!",
  });
  const noUserLoginRes = await loginHandler(noUserLoginReq);
  assert.strictEqual(noUserLoginRes.status, 401, "Non-existent user login should return 401");

  // 8. Protected Route: GET /api/v1/auth/me with Bearer token
  console.log("8. Testing GET /api/v1/auth/me with Bearer token...");
  const meReq = createJsonRequest("/api/v1/auth/me", "GET", undefined, { token: authToken });
  const meRes = await meHandler(meReq);
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200, "Auth me should return 200");
  assert.strictEqual(meData.data.email, "alice@example.com");

  // 9. Protected Route: GET /api/v1/auth/me with session cookie
  console.log("9. Testing GET /api/v1/auth/me with auth cookie...");
  const cookieMeReq = createJsonRequest("/api/v1/auth/me", "GET", undefined, { cookie: authToken });
  const cookieMeRes = await meHandler(cookieMeReq);
  const cookieMeData = await cookieMeRes.json();
  assert.strictEqual(cookieMeRes.status, 200, "Auth me via cookie should return 200");
  assert.strictEqual(cookieMeData.data.email, "alice@example.com");

  // 10. Protected Route: GET /api/v1/auth/me unauthenticated
  console.log("10. Testing GET /api/v1/auth/me unauthenticated...");
  const unauthMeReq = createJsonRequest("/api/v1/auth/me", "GET");
  const unauthMeRes = await meHandler(unauthMeReq);
  assert.strictEqual(unauthMeRes.status, 401, "Missing token should return 401");

  // 11. Protected Route: GET /api/v1/auth/me with invalid token
  console.log("11. Testing GET /api/v1/auth/me with invalid token...");
  const invalidTokenReq = createJsonRequest("/api/v1/auth/me", "GET", undefined, {
    token: "invalid.jwt.token",
  });
  const invalidTokenRes = await meHandler(invalidTokenReq);
  assert.strictEqual(invalidTokenRes.status, 401, "Invalid token should return 401");

  // 12. Reusable Ownership Authorization Check
  console.log("12. Testing Reusable User-Owned Resource Access Checks...");
  assert.doesNotThrow(() => {
    checkOwnership("user_123", "user_123");
  }, "Ownership check should pass when resourceOwnerId matches currentUserId");

  assert.throws(
    () => {
      checkOwnership("user_123", "user_other");
    },
    (err: any) => err.statusCode === 403 && err.code === "FORBIDDEN",
    "Ownership check should throw 403 FORBIDDEN when user does not own the resource"
  );

  // 13. Forgot Password Flow
  console.log("13. Testing Forgot Password Flow for existing user...");
  const forgotReq = createJsonRequest("/api/v1/auth/forgot-password", "POST", {
    email: "alice@example.com",
  });
  const forgotRes = await forgotPasswordHandler(forgotReq);
  const forgotData = await forgotRes.json();
  assert.strictEqual(forgotRes.status, 200);
  assert.ok(forgotData.data.resetToken, "Reset token should be returned");
  const resetToken = forgotData.data.resetToken;

  console.log("14. Testing Forgot Password Flow for non-existent user...");
  const forgotUnknownReq = createJsonRequest("/api/v1/auth/forgot-password", "POST", {
    email: "unknown@example.com",
  });
  const forgotUnknownRes = await forgotPasswordHandler(forgotUnknownReq);
  const forgotUnknownData = await forgotUnknownRes.json();
  assert.strictEqual(forgotUnknownRes.status, 200, "Should return 200 to prevent user enumeration");
  assert.strictEqual(forgotUnknownData.data.resetToken, null);

  // 15. Reset Password Flow
  console.log("15. Testing Reset Password with Invalid Token...");
  const invalidResetReq = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: "non_existent_token_123",
    newPassword: "BrandNewPassword123!",
  });
  const invalidResetRes = await resetPasswordHandler(invalidResetReq);
  assert.strictEqual(invalidResetRes.status, 400, "Invalid reset token should return 400");

  console.log("16. Testing Reset Password with Valid Token...");
  const validResetReq = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: resetToken,
    newPassword: "BrandNewPassword123!",
  });
  const validResetRes = await resetPasswordHandler(validResetReq);
  assert.strictEqual(validResetRes.status, 200);

  // 17. Verify old password fails and new password succeeds
  console.log("17. Verifying Password Has Changed in Login...");
  const oldLoginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "alice@example.com",
      password: "Password123!",
    })
  );
  assert.strictEqual(oldLoginRes.status, 401, "Old password should now fail");

  const newLoginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "alice@example.com",
      password: "BrandNewPassword123!",
    })
  );
  assert.strictEqual(newLoginRes.status, 200, "New password should succeed");

  // 18. Reusing the reset token should fail
  console.log("18. Testing Token Re-use Prevention...");
  const reuseResetReq = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: resetToken,
    newPassword: "AnotherPassword123!",
  });
  const reuseResetRes = await resetPasswordHandler(reuseResetReq);
  assert.strictEqual(reuseResetRes.status, 400, "Used reset token must be rejected");

  // 19. Google OAuth Flow
  console.log("19. Testing Google OAuth URL generation...");
  const googleRes = await googleHandler();
  assert.strictEqual(googleRes.status, 307, "Google OAuth should return redirect");
  assert.ok(googleRes.headers.get("location")?.includes("accounts.google.com"));

  console.log("20. Testing Google OAuth callback...");
  const googleReq = createJsonRequest(
    "/api/v1/auth/google/callback?code=test_google_123456789_googleuser",
    "GET"
  );
  const googleCallbackRes = await googleCallbackHandler(googleReq);
  const googleCallbackData = await googleCallbackRes.json();
  assert.strictEqual(googleCallbackRes.status, 200, "Google callback should return 200");
  assert.strictEqual(googleCallbackData.data.user.email, "googleuser@gmail.com");
  assert.ok(googleCallbackData.data.token, "Google callback should return JWT token");

  // 21. Logout
  console.log("21. Testing Logout...");
  const logoutRes = await logoutHandler(new NextRequest("http://localhost:3000/api/v1/auth/logout", { method: "POST" }));
  assert.strictEqual(logoutRes.status, 200, "Logout should return 200");
  const cookieHeader = logoutRes.headers.get("set-cookie");
  assert.ok(cookieHeader?.includes("poppin_token=;"), "Cookie should be cleared on logout");

  console.log("\n>>> ALL PHASE 1 TESTS PASSED SUCCESSFULLY! <<<\n");
}

if (process.argv[1]?.includes("phase1.test")) {
  runPhase1Tests().catch((err) => {
    console.error("Phase 1 test failure:", err);
    process.exit(1);
  });
}
