import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { POST as registerHandler } from "../app/api/v1/auth/register/route";
import { POST as loginHandler } from "../app/api/v1/auth/login/route";
import { GET as checkUsernameHandler } from "../app/api/v1/usernames/availability/route";
import { POST as createProfileHandler, GET as getProfileHandler, PATCH as updateProfileHandler } from "../app/api/v1/users/me/profile/route";
import { GET as getPublicProfileHandler } from "../app/api/v1/profiles/[username]/route";
import { PUT as step1Handler } from "../app/api/v1/onboarding/step-1/route";
import { PUT as step2Handler } from "../app/api/v1/onboarding/step-2/route";
import { GET as followSuggestionsHandler } from "../app/api/v1/onboarding/follow-suggestions/route";
import { POST as completeOnboardingHandler } from "../app/api/v1/onboarding/complete/route";
import { POST as followHandler, DELETE as unfollowHandler } from "../app/api/v1/users/[userId]/follow/route";
import { GET as getFollowersHandler } from "../app/api/v1/users/[userId]/followers/route";
import { GET as getMyFollowingHandler } from "../app/api/v1/users/me/following/route";
import { PATCH as updatePrivacyHandler } from "../app/api/v1/users/me/privacy/route";
import { POST as blockHandler } from "../app/api/v1/users/[userId]/block/route";
import { POST as reportHandler } from "../app/api/v1/users/[userId]/report/route";
import { DELETE as deleteAccountHandler } from "../app/api/v1/users/me/route";
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

export async function runE2EIntegrationTests() {
  console.log("=== Starting End-to-End Integration Suite: Full Identity & User Management Lifecycle ===");

  const e2eEmails = ["e2e_alice@poppin.io", "e2e_bob@poppin.io"];
  await prisma.userReport.deleteMany({
    where: {
      OR: [
        { reporter: { email: { in: e2eEmails } } },
        { reportedUser: { email: { in: e2eEmails } } },
      ],
    },
  });
  await prisma.block.deleteMany({
    where: {
      OR: [
        { blocker: { email: { in: e2eEmails } } },
        { blocked: { email: { in: e2eEmails } } },
      ],
    },
  });
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { follower: { email: { in: e2eEmails } } },
        { following: { email: { in: e2eEmails } } },
      ],
    },
  });
  await prisma.onboarding.deleteMany({
    where: { user: { email: { in: e2eEmails } } },
  });
  await prisma.privacySettings.deleteMany({
    where: { user: { email: { in: e2eEmails } } },
  });
  await prisma.profile.deleteMany({
    where: { user: { email: { in: e2eEmails } } },
  });
  await prisma.passwordResetToken.deleteMany({
    where: { user: { email: { in: e2eEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: e2eEmails } },
  });

  // Step 1: Register Alice
  console.log("1. Registering Alice...");
  const regAliceRes = await registerHandler(
    createJsonRequest("/api/v1/auth/register", "POST", {
      email: "e2e_alice@poppin.io",
      password: "AliceStrongPassword123!",
    })
  );
  const regAliceData = await regAliceRes.json();
  assert.strictEqual(regAliceRes.status, 201);
  const aliceToken = regAliceData.data.token;
  const aliceId = regAliceData.data.user.id;

  // Step 2: Register Bob
  console.log("2. Registering Bob...");
  const regBobRes = await registerHandler(
    createJsonRequest("/api/v1/auth/register", "POST", {
      email: "e2e_bob@poppin.io",
      password: "BobStrongPassword123!",
    })
  );
  const regBobData = await regBobRes.json();
  assert.strictEqual(regBobRes.status, 201);
  const bobToken = regBobData.data.token;
  const bobId = regBobData.data.user.id;

  // Step 3: Alice creates her profile
  console.log("3. Alice creates profile...");
  const aliceProfileRes = await createProfileHandler(
    createJsonRequest(
      "/api/v1/users/me/profile",
      "POST",
      {
        username: "alice_poppin",
        displayName: "Alice Poppin",
        headline: "Frontend Architect",
        bio: "Passionate about modern web tech",
        location: "San Francisco, CA",
      },
      aliceToken
    )
  );
  assert.strictEqual(aliceProfileRes.status, 201);

  // Step 4: Bob checks username availability and creates profile
  console.log("4. Bob checks availability for 'alice_poppin' (taken) and 'bob_poppin' (available)...");
  const checkTaken = await checkUsernameHandler(createJsonRequest("/api/v1/usernames/availability?username=alice_poppin", "GET"));
  const checkTakenData = await checkTaken.json();
  assert.strictEqual(checkTakenData.data.isAvailable, false);

  const checkFree = await checkUsernameHandler(createJsonRequest("/api/v1/usernames/availability?username=bob_poppin", "GET"));
  const checkFreeData = await checkFree.json();
  assert.strictEqual(checkFreeData.data.isAvailable, true);

  const bobProfileRes = await createProfileHandler(
    createJsonRequest(
      "/api/v1/users/me/profile",
      "POST",
      {
        username: "bob_poppin",
        displayName: "Bob Poppin",
        headline: "Backend Engineer",
      },
      bobToken
    )
  );
  assert.strictEqual(bobProfileRes.status, 201);

  // Step 5: Alice goes through 3-step onboarding flow
  console.log("5. Alice completes Onboarding (Step 1, Step 2, Follow Suggestions, Complete)...");
  await step1Handler(
    createJsonRequest(
      "/api/v1/onboarding/step-1",
      "PUT",
      { role: "Software Engineer", headline: "Full-Stack Dev" },
      aliceToken
    )
  );

  await step2Handler(
    createJsonRequest(
      "/api/v1/onboarding/step-2",
      "PUT",
      { skills: ["React", "TypeScript", "Next.js"], interests: ["Web3", "AI"] },
      aliceToken
    )
  );

  const suggestionsRes = await followSuggestionsHandler(
    createJsonRequest("/api/v1/onboarding/follow-suggestions", "GET", undefined, aliceToken)
  );
  const suggestionsData = await suggestionsRes.json();
  assert.strictEqual(suggestionsRes.status, 200);
  assert.ok(suggestionsData.data.some((u: any) => u.username === "bob_poppin"), "Bob must be in suggestions");

  const completeOnbRes = await completeOnboardingHandler(
    createJsonRequest("/api/v1/onboarding/complete", "POST", undefined, aliceToken)
  );
  const completeOnbData = await completeOnbRes.json();
  assert.strictEqual(completeOnbData.data.isCompleted, true);

  // Step 6: Alice follows Bob
  console.log("6. Alice follows Bob...");
  const followRes = await followHandler(
    createJsonRequest(`/api/v1/users/${bobId}/follow`, "POST", undefined, aliceToken),
    { params: Promise.resolve({ userId: bobId }) }
  );
  const followData = await followRes.json();
  assert.strictEqual(followRes.status, 201);
  assert.strictEqual(followData.data.isFollowing, true);

  // Verify Bob's public profile reflects 1 follower
  const pubBobRes = await getPublicProfileHandler(
    createJsonRequest("/api/v1/profiles/bob_poppin", "GET", undefined, aliceToken),
    { params: Promise.resolve({ username: "bob_poppin" }) }
  );
  const pubBobData = await pubBobRes.json();
  assert.strictEqual(pubBobData.data.followersCount, 1);

  // Step 7: Bob updates privacy to private
  console.log("7. Bob updates privacy settings...");
  const privRes = await updatePrivacyHandler(
    createJsonRequest("/api/v1/users/me/privacy", "PATCH", { isPrivate: true }, bobToken)
  );
  const privData = await privRes.json();
  assert.strictEqual(privData.data.isPrivate, true);

  // Step 8: Alice reports Bob for spam
  console.log("8. Alice reports Bob for spam...");
  const reportRes = await reportHandler(
    createJsonRequest(
      `/api/v1/users/${bobId}/report`,
      "POST",
      { reason: "SPAM", details: "Posting automated links" },
      aliceToken
    ),
    { params: Promise.resolve({ userId: bobId }) }
  );
  assert.strictEqual(reportRes.status, 201);

  // Step 9: Bob blocks Alice (Severs follow relationship)
  console.log("9. Bob blocks Alice (Follow relationship must be automatically severed)...");
  const blockRes = await blockHandler(
    createJsonRequest(`/api/v1/users/${aliceId}/block`, "POST", undefined, bobToken),
    { params: Promise.resolve({ userId: aliceId }) }
  );
  assert.strictEqual(blockRes.status, 200);

  // Bob's followers count should now be 0
  const pubBobAfterBlock = await getPublicProfileHandler(
    createJsonRequest("/api/v1/profiles/bob_poppin", "GET", undefined, bobToken),
    { params: Promise.resolve({ username: "bob_poppin" }) }
  );
  const pubBobAfterBlockData = await pubBobAfterBlock.json();
  assert.strictEqual(pubBobAfterBlockData.data.followersCount, 0, "Bob should now have 0 followers");

  // Step 10: Alice attempts to follow Bob again -> 403 Forbidden
  console.log("10. Alice attempts to follow Bob while blocked (Should be rejected with 403)...");
  const refollowRes = await followHandler(
    createJsonRequest(`/api/v1/users/${bobId}/follow`, "POST", undefined, aliceToken),
    { params: Promise.resolve({ userId: bobId }) }
  );
  assert.strictEqual(refollowRes.status, 403);

  // Step 11: Alice deletes her account
  console.log("11. Alice deletes her account...");
  const delRes = await deleteAccountHandler(
    createJsonRequest("/api/v1/users/me", "DELETE", undefined, aliceToken)
  );
  assert.strictEqual(delRes.status, 200);

  // Alice's token is immediately revoked
  const checkDel = await meHandler(createJsonRequest("/api/v1/auth/me", "GET", undefined, aliceToken));
  assert.strictEqual(checkDel.status, 401);

  console.log("\n=== ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n");
}

if (process.argv[1]?.includes("e2e-integration.test")) {
  runE2EIntegrationTests().catch((err) => {
    console.error("E2E Integration test failure:", err);
    process.exit(1);
  });
}

