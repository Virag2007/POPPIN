import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { POST as registerHandler } from "../app/api/v1/auth/register/route";
import { POST as loginHandler } from "../app/api/v1/auth/login/route";
import { GET as meHandler } from "../app/api/v1/auth/me/route";
import { POST as forgotPasswordHandler } from "../app/api/v1/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "../app/api/v1/auth/reset-password/route";
import { POST as logoutHandler } from "../app/api/v1/auth/logout/route";
import { GET as googleCallbackHandler } from "../app/api/v1/auth/google/callback/route";

function createJsonRequest(url: string, method: string, body?: any, token?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function runPhase1Tests() {
  console.log("--- Starting Phase 1 Tests: Authentication & Authorization ---");

  // Clean test users before running
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

  // 3. Validation error on weak password
  console.log("3. Testing Registration Validation...");
  const weakReq = createJsonRequest("/api/v1/auth/register", "POST", {
    email: "bob@example.com",
    password: "short",
  });
  const weakRes = await registerHandler(weakReq);
  assert.strictEqual(weakRes.status, 400, "Short password should return 400");

  // 4. Login with valid credentials
  console.log("4. Testing Valid Login...");
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

  // 5. Login with invalid password
  console.log("5. Testing Invalid Password Login...");
  const badLoginReq = createJsonRequest("/api/v1/auth/login", "POST", {
    email: "alice@example.com",
    password: "WrongPassword!",
  });
  const badLoginRes = await loginHandler(badLoginReq);
  assert.strictEqual(badLoginRes.status, 401, "Invalid password should return 401");

  // 6. Test GET /api/v1/auth/me (Protected route)
  console.log("6. Testing GET /api/v1/auth/me with valid Bearer token...");
  const meReq = createJsonRequest("/api/v1/auth/me", "GET", undefined, authToken);
  const meRes = await meHandler(meReq);
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200, "Auth me should return 200");
  assert.strictEqual(meData.data.email, "alice@example.com");

  // 7. Test GET /api/v1/auth/me without token (Unauthorized)
  console.log("7. Testing GET /api/v1/auth/me unauthenticated...");
  const unauthMeReq = createJsonRequest("/api/v1/auth/me", "GET");
  const unauthMeRes = await meHandler(unauthMeReq);
  assert.strictEqual(unauthMeRes.status, 401, "Missing token should return 401");

  // 8. Test Forgot Password & Reset Password Flow
  console.log("8. Testing Forgot Password Flow...");
  const forgotReq = createJsonRequest("/api/v1/auth/forgot-password", "POST", {
    email: "alice@example.com",
  });
  const forgotRes = await forgotPasswordHandler(forgotReq);
  const forgotData = await forgotRes.json();
  assert.strictEqual(forgotRes.status, 200);
  assert.ok(forgotData.data.resetToken, "Reset token should be generated");
  const resetToken = forgotData.data.resetToken;

  console.log("9. Testing Reset Password Flow...");
  const resetReq = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: resetToken,
    newPassword: "BrandNewPassword123!",
  });
  const resetRes = await resetPasswordHandler(resetReq);
  assert.strictEqual(resetRes.status, 200);

  // Login with old password should fail
  const oldLoginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "alice@example.com",
      password: "Password123!",
    })
  );
  assert.strictEqual(oldLoginRes.status, 401, "Old password should fail");

  // Login with new password should succeed
  const newLoginRes = await loginHandler(
    createJsonRequest("/api/v1/auth/login", "POST", {
      email: "alice@example.com",
      password: "BrandNewPassword123!",
    })
  );
  assert.strictEqual(newLoginRes.status, 200, "New password should succeed");

  // Re-using reset token should fail
  const reuseResetReq = createJsonRequest("/api/v1/auth/reset-password", "POST", {
    token: resetToken,
    newPassword: "BrandNewPassword123!",
  });
  const reuseResetRes = await resetPasswordHandler(reuseResetReq);
  assert.strictEqual(reuseResetRes.status, 400, "Used reset token should return 400");

  // 10. Test Google OAuth callback mapping
  console.log("10. Testing Google OAuth callback...");
  const googleReq = createJsonRequest(
    "/api/v1/auth/google/callback?code=test_google_123456789_googleuser",
    "GET"
  );
  const googleRes = await googleCallbackHandler(googleReq);
  const googleData = await googleRes.json();
  assert.strictEqual(googleRes.status, 200, "Google callback should return 200");
  assert.strictEqual(googleData.data.user.email, "googleuser@gmail.com");
  assert.ok(googleData.data.token, "Google callback should return JWT token");

  // 11. Test Logout
  console.log("11. Testing Logout...");
  const logoutRes = await logoutHandler();
  assert.strictEqual(logoutRes.status, 200, "Logout should return 200");

  console.log(">>> Phase 1 Tests Passed Successfully! <<<\n");
}

if (process.argv[1]?.includes("phase1.test")) {
  runPhase1Tests().catch((err) => {
    console.error("Phase 1 test failure:", err);
    process.exit(1);
  });
}
