import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { GET as getAccountHandler, PATCH as updateAccountHandler } from "../app/api/v1/users/me/account/route";
import { GET as getPrivacyHandler, PATCH as updatePrivacyHandler } from "../app/api/v1/users/me/privacy/route";
import { DELETE as deleteAccountHandler } from "../app/api/v1/users/me/route";
import { POST as blockHandler, DELETE as unblockHandler } from "../app/api/v1/users/[userId]/block/route";
import { POST as reportHandler } from "../app/api/v1/users/[userId]/report/route";
import { GET as meHandler } from "../app/api/v1/auth/me/route";

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

export async function runPhase5Tests() {
  console.log("--- Starting Phase 5 Tests: Account Settings & Safety ---");

  // Clean data
  await prisma.userReport.deleteMany();
  await prisma.block.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.privacySettings.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "safety_user1@example.com",
          "safety_user2@example.com",
          "updated_email@example.com",
        ],
      },
    },
  });

  // User 1
  const user1 = await prisma.user.create({
    data: {
      email: "safety_user1@example.com",
      profile: {
        create: {
          username: "safety_one",
          displayName: "Safety User One",
        },
      },
      privacySettings: {
        create: {},
      },
    },
  });
  const token1 = signToken({ userId: user1.id, email: user1.email });

  // User 2
  const user2 = await prisma.user.create({
    data: {
      email: "safety_user2@example.com",
      profile: {
        create: {
          username: "safety_two",
          displayName: "Safety User Two",
        },
      },
      privacySettings: {
        create: {},
      },
    },
  });
  const token2 = signToken({ userId: user2.id, email: user2.email });

  // Set up follow relationship from user1 to user2
  await prisma.follow.create({
    data: {
      followerId: user1.id,
      followingId: user2.id,
    },
  });

  // 1. Retrieve Account Details (GET /api/v1/users/me/account)
  console.log("1. Testing GET /api/v1/users/me/account...");
  const getAccReq = createJsonRequest("/api/v1/users/me/account", "GET", undefined, token1);
  const getAccRes = await getAccountHandler(getAccReq);
  const getAccData = await getAccRes.json();
  assert.strictEqual(getAccRes.status, 200);
  assert.strictEqual(getAccData.data.email, "safety_user1@example.com");
  assert.strictEqual(getAccData.data.username, "safety_one");
  assert.strictEqual(getAccData.data.hasPassword, false);

  // 2. Update Account Details (PATCH /api/v1/users/me/account)
  console.log("2. Testing PATCH /api/v1/users/me/account (Update email)...");
  const patchAccReq = createJsonRequest(
    "/api/v1/users/me/account",
    "PATCH",
    { email: "updated_email@example.com" },
    token1
  );
  const patchAccRes = await updateAccountHandler(patchAccReq);
  const patchAccData = await patchAccRes.json();
  assert.strictEqual(patchAccRes.status, 200);
  assert.strictEqual(patchAccData.data.email, "updated_email@example.com");

  // Prevent duplicate email update
  console.log("3. Testing Duplicate Email Rejection on Account Update...");
  const dupEmailReq = createJsonRequest(
    "/api/v1/users/me/account",
    "PATCH",
    { email: "safety_user2@example.com" },
    token1
  );
  const dupEmailRes = await updateAccountHandler(dupEmailReq);
  assert.strictEqual(dupEmailRes.status, 409);

  // 4. Retrieve Privacy Settings (GET /api/v1/users/me/privacy)
  console.log("4. Testing GET /api/v1/users/me/privacy...");
  const getPrivReq = createJsonRequest("/api/v1/users/me/privacy", "GET", undefined, token1);
  const getPrivRes = await getPrivacyHandler(getPrivReq);
  const getPrivData = await getPrivRes.json();
  assert.strictEqual(getPrivRes.status, 200);
  assert.strictEqual(getPrivData.data.isPrivate, false);
  assert.strictEqual(getPrivData.data.showActivityStatus, true);

  // 5. Update Privacy Settings (PATCH /api/v1/users/me/privacy)
  console.log("5. Testing PATCH /api/v1/users/me/privacy...");
  const patchPrivReq = createJsonRequest(
    "/api/v1/users/me/privacy",
    "PATCH",
    { isPrivate: true, showActivityStatus: false },
    token1
  );
  const patchPrivRes = await updatePrivacyHandler(patchPrivReq);
  const patchPrivData = await patchPrivRes.json();
  assert.strictEqual(patchPrivRes.status, 200);
  assert.strictEqual(patchPrivData.data.isPrivate, true);
  assert.strictEqual(patchPrivData.data.showActivityStatus, false);

  // 6. Block User (POST /api/v1/users/{userId}/block)
  console.log("6. Testing User Blocking (Removes follow relations)...");
  const blockReq = createJsonRequest(`/api/v1/users/${user2.id}/block`, "POST", undefined, token1);
  const blockRes = await blockHandler(blockReq, {
    params: Promise.resolve({ userId: user2.id }),
  });
  const blockData = await blockRes.json();
  assert.strictEqual(blockRes.status, 200);
  assert.strictEqual(blockData.data.blocked, true);

  // Verify follow was removed in database
  const followAfterBlock = await prisma.follow.findFirst({
    where: { followerId: user1.id, followingId: user2.id },
  });
  assert.strictEqual(followAfterBlock, null, "Follow relationship must be severed upon blocking");

  // Prevent self-block
  const selfBlockReq = createJsonRequest(`/api/v1/users/${user1.id}/block`, "POST", undefined, token1);
  const selfBlockRes = await blockHandler(selfBlockReq, {
    params: Promise.resolve({ userId: user1.id }),
  });
  assert.strictEqual(selfBlockRes.status, 400);

  // Prevent duplicate block
  const dupBlockReq = createJsonRequest(`/api/v1/users/${user2.id}/block`, "POST", undefined, token1);
  const dupBlockRes = await blockHandler(dupBlockReq, {
    params: Promise.resolve({ userId: user2.id }),
  });
  assert.strictEqual(dupBlockRes.status, 409);

  // 7. Unblock User (DELETE /api/v1/users/{userId}/block)
  console.log("7. Testing User Unblocking...");
  const unblockReq = createJsonRequest(`/api/v1/users/${user2.id}/block`, "DELETE", undefined, token1);
  const unblockRes = await unblockHandler(unblockReq, {
    params: Promise.resolve({ userId: user2.id }),
  });
  const unblockData = await unblockRes.json();
  assert.strictEqual(unblockRes.status, 200);
  assert.strictEqual(unblockData.data.unblocked, true);

  // Unblocking non-blocked user fails with 404
  const unblockAgainReq = createJsonRequest(`/api/v1/users/${user2.id}/block`, "DELETE", undefined, token1);
  const unblockAgainRes = await unblockHandler(unblockAgainReq, {
    params: Promise.resolve({ userId: user2.id }),
  });
  assert.strictEqual(unblockAgainRes.status, 404);

  // 8. Report User (POST /api/v1/users/{userId}/report)
  console.log("8. Testing User Reporting...");
  const reportReq = createJsonRequest(
    `/api/v1/users/${user2.id}/report`,
    "POST",
    { reason: "SPAM", details: "Sending suspicious unsolicited links" },
    token1
  );
  const reportRes = await reportHandler(reportReq, {
    params: Promise.resolve({ userId: user2.id }),
  });
  const reportData = await reportRes.json();
  assert.strictEqual(reportRes.status, 201);
  assert.strictEqual(reportData.data.reported, true);
  assert.strictEqual(reportData.data.reason, "SPAM");
  assert.strictEqual(reportData.data.status, "PENDING");

  // Prevent self-reporting
  const selfReportReq = createJsonRequest(
    `/api/v1/users/${user1.id}/report`,
    "POST",
    { reason: "SPAM" },
    token1
  );
  const selfReportRes = await reportHandler(selfReportReq, {
    params: Promise.resolve({ userId: user1.id }),
  });
  assert.strictEqual(selfReportRes.status, 400);

  // 9. Account Deletion (DELETE /api/v1/users/me)
  console.log("9. Testing Account Deletion (Cascade delete & session revocation)...");
  const delAccReq = createJsonRequest("/api/v1/users/me", "DELETE", undefined, token1);
  const delAccRes = await deleteAccountHandler(delAccReq);
  const delAccData = await delAccRes.json();
  assert.strictEqual(delAccRes.status, 200);
  assert.strictEqual(delAccData.data.deleted, true);

  // Verify user1 no longer exists in DB
  const dbUserAfterDel = await prisma.user.findUnique({ where: { id: user1.id } });
  assert.strictEqual(dbUserAfterDel, null, "Deleted user must not exist in DB");

  // Attempting to use deleted user's token should return 401 USER_NOT_FOUND
  const checkDeletedAuthReq = createJsonRequest("/api/v1/auth/me", "GET", undefined, token1);
  const checkDeletedAuthRes = await meHandler(checkDeletedAuthReq);
  assert.strictEqual(checkDeletedAuthRes.status, 401, "Deleted user token must be rejected");

  console.log(">>> Phase 5 Tests Passed Successfully! <<<\n");
}

if (process.argv[1]?.includes("phase5.test")) {
  runPhase5Tests().catch((err) => {
    console.error("Phase 5 test failure:", err);
    process.exit(1);
  });
}

