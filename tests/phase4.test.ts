import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { POST as followHandler, DELETE as unfollowHandler } from "../app/api/v1/users/[userId]/follow/route";
import { GET as getFollowersHandler } from "../app/api/v1/users/[userId]/followers/route";
import { GET as getFollowingHandler } from "../app/api/v1/users/[userId]/following/route";
import { GET as getMyFollowersHandler } from "../app/api/v1/users/me/followers/route";
import { GET as getMyFollowingHandler } from "../app/api/v1/users/me/following/route";
import { GET as getSuggestionsHandler } from "../app/api/v1/users/suggestions/route";
import { GET as getPublicProfileHandler } from "../app/api/v1/profiles/[username]/route";

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

export async function runPhase4Tests() {
  console.log("--- Starting Phase 4 Tests: Connections & Follow Relationships ---");

  const testConnEmails = [
    "conn_alice@example.com",
    "conn_bob@example.com",
    "conn_charlie@example.com",
    "conn_david@example.com",
  ];

  // Clean data for test users
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { follower: { email: { in: testConnEmails } } },
        { following: { email: { in: testConnEmails } } },
      ],
    },
  });
  await prisma.block.deleteMany({
    where: {
      OR: [
        { blocker: { email: { in: testConnEmails } } },
        { blocked: { email: { in: testConnEmails } } },
      ],
    },
  });
  await prisma.profile.deleteMany({
    where: { user: { email: { in: testConnEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testConnEmails } },
  });

  // Create Alice
  const alice = await prisma.user.create({
    data: {
      email: "conn_alice@example.com",
      profile: {
        create: {
          username: "alice_conn",
          displayName: "Alice Connections",
        },
      },
    },
  });
  const aliceToken = signToken({ userId: alice.id, email: alice.email });

  // Create Bob
  const bob = await prisma.user.create({
    data: {
      email: "conn_bob@example.com",
      profile: {
        create: {
          username: "bob_conn",
          displayName: "Bob Connections",
        },
      },
    },
  });
  const bobToken = signToken({ userId: bob.id, email: bob.email });

  // Create Charlie (will be blocked)
  const charlie = await prisma.user.create({
    data: {
      email: "conn_charlie@example.com",
      profile: {
        create: {
          username: "charlie_conn",
          displayName: "Charlie Connections",
        },
      },
    },
  });

  // Create David (suggested person)
  const david = await prisma.user.create({
    data: {
      email: "conn_david@example.com",
      profile: {
        create: {
          username: "david_conn",
          displayName: "David Connections",
        },
      },
    },
  });

  // Alice blocks Charlie
  await prisma.block.create({
    data: {
      blockerId: alice.id,
      blockedId: charlie.id,
    },
  });

  // 1. Alice follows Bob
  console.log("1. Testing Alice following Bob (POST /api/v1/users/{userId}/follow)...");
  const followBobReq = createJsonRequest(`/api/v1/users/${bob.id}/follow`, "POST", undefined, aliceToken);
  const followBobRes = await followHandler(followBobReq, {
    params: Promise.resolve({ userId: bob.id }),
  });
  const followBobData = await followBobRes.json();
  assert.strictEqual(followBobRes.status, 201, "Follow should return 201 Created");
  assert.strictEqual(followBobData.data.isFollowing, true);
  assert.ok(followBobData.data.followEvent, "Follow event contract must exist");
  assert.strictEqual(followBobData.data.followEvent.event, "NEW_FOLLOWER");
  assert.strictEqual(followBobData.data.followEvent.followerId, alice.id);
  assert.strictEqual(followBobData.data.followEvent.targetUserId, bob.id);
  assert.strictEqual(followBobData.data.currentUserCounts.followingCount, 1);

  // 2. Prevent self-follow
  console.log("2. Testing Self-Follow Prevention...");
  const selfFollowReq = createJsonRequest(`/api/v1/users/${alice.id}/follow`, "POST", undefined, aliceToken);
  const selfFollowRes = await followHandler(selfFollowReq, {
    params: Promise.resolve({ userId: alice.id }),
  });
  assert.strictEqual(selfFollowRes.status, 400, "Self follow must return 400");
  const selfFollowData = await selfFollowRes.json();
  assert.strictEqual(selfFollowData.error.code, "CANNOT_FOLLOW_SELF");

  // 3. Prevent following non-existent user
  console.log("3. Testing Non-Existent User Follow Prevention...");
  const fakeUserReq = createJsonRequest("/api/v1/users/fake-user-id-999/follow", "POST", undefined, aliceToken);
  const fakeUserRes = await followHandler(fakeUserReq, {
    params: Promise.resolve({ userId: "fake-user-id-999" }),
  });
  assert.strictEqual(fakeUserRes.status, 404, "Following non-existent user must return 404");

  // 4. Prevent following blocked user
  console.log("4. Testing Blocked User Follow Prevention...");
  const blockedReq = createJsonRequest(`/api/v1/users/${charlie.id}/follow`, "POST", undefined, aliceToken);
  const blockedRes = await followHandler(blockedReq, {
    params: Promise.resolve({ userId: charlie.id }),
  });
  assert.strictEqual(blockedRes.status, 403, "Following blocked user must return 403 Forbidden");

  // 5. Prevent duplicate follow
  console.log("5. Testing Duplicate Follow Prevention...");
  const dupFollowReq = createJsonRequest(`/api/v1/users/${bob.id}/follow`, "POST", undefined, aliceToken);
  const dupFollowRes = await followHandler(dupFollowReq, {
    params: Promise.resolve({ userId: bob.id }),
  });
  assert.strictEqual(dupFollowRes.status, 409, "Duplicate follow must return 409 Conflict");
  const dupFollowData = await dupFollowRes.json();
  assert.strictEqual(dupFollowData.error.code, "ALREADY_FOLLOWING");

  // 6. Verify accurate count in Public Profile endpoint
  console.log("6. Verifying Follower Count in Public Profile...");
  const bobProfileReq = createJsonRequest("/api/v1/profiles/bob_conn", "GET");
  const bobProfileRes = await getPublicProfileHandler(bobProfileReq, {
    params: Promise.resolve({ username: "bob_conn" }),
  });
  const bobProfileData = await bobProfileRes.json();
  assert.strictEqual(bobProfileData.data.followersCount, 1, "Bob should have 1 follower");
  assert.strictEqual(bobProfileData.data.followingCount, 0, "Bob is following 0 users");

  // 7. Test GET /api/v1/users/me/following (Alice's following)
  console.log("7. Testing GET /api/v1/users/me/following...");
  const myFollowingReq = createJsonRequest("/api/v1/users/me/following", "GET", undefined, aliceToken);
  const myFollowingRes = await getMyFollowingHandler(myFollowingReq);
  const myFollowingData = await myFollowingRes.json();
  assert.strictEqual(myFollowingRes.status, 200);
  assert.strictEqual(myFollowingData.data.total, 1);
  assert.strictEqual(myFollowingData.data.items[0].userId, bob.id);
  assert.strictEqual(myFollowingData.data.items[0].username, "bob_conn");

  // 8. Test GET /api/v1/users/{userId}/followers (Bob's followers)
  console.log("8. Testing GET /api/v1/users/{userId}/followers...");
  const bobFollowersReq = createJsonRequest(`/api/v1/users/${bob.id}/followers`, "GET");
  const bobFollowersRes = await getFollowersHandler(bobFollowersReq, {
    params: Promise.resolve({ userId: bob.id }),
  });
  const bobFollowersData = await bobFollowersRes.json();
  assert.strictEqual(bobFollowersRes.status, 200);
  assert.strictEqual(bobFollowersData.data.total, 1);
  assert.strictEqual(bobFollowersData.data.items[0].userId, alice.id);
  assert.strictEqual(bobFollowersData.data.items[0].username, "alice_conn");

  // 9. Test GET /api/v1/users/me/followers (Bob's view of his followers)
  console.log("9. Testing GET /api/v1/users/me/followers...");
  const bobMyFollowersReq = createJsonRequest("/api/v1/users/me/followers", "GET", undefined, bobToken);
  const bobMyFollowersRes = await getMyFollowersHandler(bobMyFollowersReq);
  const bobMyFollowersData = await bobMyFollowersRes.json();
  assert.strictEqual(bobMyFollowersRes.status, 200);
  assert.strictEqual(bobMyFollowersData.data.total, 1);
  assert.strictEqual(bobMyFollowersData.data.items[0].username, "alice_conn");

  // 10. Test GET /api/v1/users/suggestions (Suggested people for Alice)
  console.log("10. Testing GET /api/v1/users/suggestions (Excludes self, Bob, and blocked Charlie)...");
  const suggestReq = createJsonRequest("/api/v1/users/suggestions", "GET", undefined, aliceToken);
  const suggestRes = await getSuggestionsHandler(suggestReq);
  const suggestData = await suggestRes.json();
  assert.strictEqual(suggestRes.status, 200);
  const suggestedUsernames = suggestData.data.map((u: any) => u.username);
  assert.ok(suggestedUsernames.includes("david_conn"), "David should be suggested");
  assert.ok(!suggestedUsernames.includes("alice_conn"), "Alice must NOT be in her suggestions");
  assert.ok(!suggestedUsernames.includes("bob_conn"), "Bob (already followed) must NOT be suggested");
  assert.ok(!suggestedUsernames.includes("charlie_conn"), "Charlie (blocked) must NOT be suggested");

  // 11. Test Unfollow (DELETE /api/v1/users/{userId}/follow)
  console.log("11. Testing Unfollow (DELETE /api/v1/users/{userId}/follow)...");
  const unfollowReq = createJsonRequest(`/api/v1/users/${bob.id}/follow`, "DELETE", undefined, aliceToken);
  const unfollowRes = await unfollowHandler(unfollowReq, {
    params: Promise.resolve({ userId: bob.id }),
  });
  const unfollowData = await unfollowRes.json();
  assert.strictEqual(unfollowRes.status, 200);
  assert.strictEqual(unfollowData.data.isFollowing, false);
  assert.strictEqual(unfollowData.data.currentUserCounts.followingCount, 0);

  // Verify count is 0 in database
  const countAfterUnfollow = await prisma.follow.count({ where: { followingId: bob.id } });
  assert.strictEqual(countAfterUnfollow, 0, "Bob follower count should be 0 after unfollow");

  // 12. Test Unfollow when not following (404)
  console.log("12. Testing Unfollow when not following...");
  const badUnfollowReq = createJsonRequest(`/api/v1/users/${bob.id}/follow`, "DELETE", undefined, aliceToken);
  const badUnfollowRes = await unfollowHandler(badUnfollowReq, {
    params: Promise.resolve({ userId: bob.id }),
  });
  assert.strictEqual(badUnfollowRes.status, 404);

  // 13. Unauthenticated protection
  console.log("13. Testing unauthenticated access...");
  const unauthReq = createJsonRequest(`/api/v1/users/${bob.id}/follow`, "POST");
  const unauthRes = await followHandler(unauthReq, {
    params: Promise.resolve({ userId: bob.id }),
  });
  assert.strictEqual(unauthRes.status, 401);

  console.log(">>> Phase 4 Tests Passed Successfully! <<<\n");
}

if (process.argv[1]?.includes("phase4.test")) {
  runPhase4Tests().catch((err) => {
    console.error("Phase 4 test failure:", err);
    process.exit(1);
  });
}
