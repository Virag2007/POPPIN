// POPPIN Phase 3: Feed Verification Suite
// Verifies Following Feed, For You Basic Ranking, Privacy/Block Integration, and Cursor Pagination

import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { POST as createPostHandler } from "../app/api/v1/posts/route";
import { POST as likePostHandler } from "../app/api/v1/posts/[postId]/like/route";
import { POST as addCommentHandler } from "../app/api/v1/posts/[postId]/comments/route";
import { GET as getFollowingFeedHandler } from "../app/api/v1/feed/following/route";
import { GET as getForYouFeedHandler } from "../app/api/v1/feed/for-you/route";

function createJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  options?: { token?: string }
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function runPhase3FeedTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 3: FEED & RANKING TESTS          ");
  console.log("==================================================");

  const testEmails = [
    "feed_alice@poppin.io",
    "feed_bob@poppin.io",
    "feed_charlie@poppin.io",
    "feed_dave@poppin.io",
    "feed_eve@poppin.io",
    "feed_frank@poppin.io",
  ];

  // Clean test database before running
  await prisma.comment.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.like.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.savedPost.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.post.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { follower: { email: { in: testEmails } } },
        { following: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.block.deleteMany({
    where: {
      OR: [
        { blocker: { email: { in: testEmails } } },
        { blocked: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.privacySettings.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.profile.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  // Setup test users
  // Alice: viewer
  const alice = await prisma.user.create({
    data: {
      email: "feed_alice@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "feed_alice", displayName: "Alice" } },
    },
  });
  const aliceToken = signToken({ userId: alice.id, email: alice.email, tokenVersion: 1 });

  // Bob: followed by Alice, public
  const bob = await prisma.user.create({
    data: {
      email: "feed_bob@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "feed_bob", displayName: "Bob" } },
    },
  });
  const bobToken = signToken({ userId: bob.id, email: bob.email, tokenVersion: 1 });

  // Charlie: unfollowed by Alice, public
  const charlie = await prisma.user.create({
    data: {
      email: "feed_charlie@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "feed_charlie", displayName: "Charlie" } },
    },
  });
  const charlieToken = signToken({ userId: charlie.id, email: charlie.email, tokenVersion: 1 });

  // Dave: followed by Alice, but blocked by Alice
  const dave = await prisma.user.create({
    data: {
      email: "feed_dave@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "feed_dave", displayName: "Dave" } },
    },
  });
  const daveToken = signToken({ userId: dave.id, email: dave.email, tokenVersion: 1 });

  // Eve: private profile, followed by Alice
  const eve = await prisma.user.create({
    data: {
      email: "feed_eve@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "feed_eve", displayName: "Eve" } },
      privacySettings: { create: { isPrivate: true } },
    },
  });
  const eveToken = signToken({ userId: eve.id, email: eve.email, tokenVersion: 1 });

  // Frank: private profile, NOT followed by Alice
  const frank = await prisma.user.create({
    data: {
      email: "feed_frank@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "feed_frank", displayName: "Frank" } },
      privacySettings: { create: { isPrivate: true } },
    },
  });
  const frankToken = signToken({ userId: frank.id, email: frank.email, tokenVersion: 1 });

  // Set up Follow relationships
  await prisma.follow.create({ data: { followerId: alice.id, followingId: bob.id } });
  await prisma.follow.create({ data: { followerId: alice.id, followingId: dave.id } });
  await prisma.follow.create({ data: { followerId: alice.id, followingId: eve.id } });

  // Set up Block (Alice blocks Dave)
  await prisma.block.create({ data: { blockerId: alice.id, blockedId: dave.id } });

  // Create Posts
  // Alice posts
  const alicePostReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Alice's own update #alice",
    type: "UPDATE",
  }, { token: aliceToken });
  const alicePostRes = await createPostHandler(alicePostReq);
  const alicePostJson = await alicePostRes.json();
  const alicePostId = alicePostJson.data.id;

  // Bob posts (3 posts for pagination tests)
  const bobPostIds: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const bReq = createJsonRequest("/api/v1/posts", "POST", {
      content: `Bob's post ${i} #bob`,
      type: "PROJECT_SHOWCASE",
    }, { token: bobToken });
    const bRes = await createPostHandler(bReq);
    const bJson = await bRes.json();
    bobPostIds.push(bJson.data.id);
  }

  // Charlie posts (unfollowed)
  const charlieLowReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Charlie low engagement post #charlie",
    type: "UPDATE",
  }, { token: charlieToken });
  const charlieLowRes = await createPostHandler(charlieLowReq);
  const charlieLowJson = await charlieLowRes.json();
  const charlieLowId = charlieLowJson.data.id;

  const charlieHighReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Charlie high viral engagement post #charlie #viral",
    type: "ACHIEVEMENT",
  }, { token: charlieToken });
  const charlieHighRes = await createPostHandler(charlieHighReq);
  const charlieHighJson = await charlieHighRes.json();
  const charlieHighId = charlieHighJson.data.id;

  // Dave posts (blocked)
  const davePostReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Dave post from blocked user #blocked",
    type: "UPDATE",
  }, { token: daveToken });
  const davePostRes = await createPostHandler(davePostReq);
  const davePostJson = await davePostRes.json();
  const davePostId = davePostJson.data.id;

  // Eve post (private, but followed by Alice)
  const evePostReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Eve private post followed by Alice #eve",
    type: "UPDATE",
  }, { token: eveToken });
  const evePostRes = await createPostHandler(evePostReq);
  const evePostJson = await evePostRes.json();
  const evePostId = evePostJson.data.id;

  // Frank post (private, NOT followed by Alice)
  const frankPostReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Frank private post hidden from Alice #frank",
    type: "UPDATE",
  }, { token: frankToken });
  const frankPostRes = await createPostHandler(frankPostReq);
  const frankPostJson = await frankPostRes.json();
  const frankPostId = frankPostJson.data.id;

  // Add engagement to Charlie's viral post (Bob and Alice like and comment)
  await likePostHandler(
    createJsonRequest(`/api/v1/posts/${charlieHighId}/like`, "POST", undefined, { token: bobToken }),
    { params: Promise.resolve({ postId: charlieHighId }) }
  );
  await likePostHandler(
    createJsonRequest(`/api/v1/posts/${charlieHighId}/like`, "POST", undefined, { token: aliceToken }),
    { params: Promise.resolve({ postId: charlieHighId }) }
  );
  await addCommentHandler(
    createJsonRequest(`/api/v1/posts/${charlieHighId}/comments`, "POST", { content: "Incredible achievement!" }, { token: bobToken }),
    { params: Promise.resolve({ postId: charlieHighId }) }
  );

  // 1. Verify Following Feed Content & Boundaries
  console.log("1. Testing Following Feed (Includes followed & self, excludes unfollowed & blocked)...");
  const followFeedReq = createJsonRequest("/api/v1/feed/following", "GET", undefined, { token: aliceToken });
  const followFeedRes = await getFollowingFeedHandler(followFeedReq);
  const followFeedJson = await followFeedRes.json();
  assert.strictEqual(followFeedRes.status, 200);

  const returnedIds: string[] = followFeedJson.data.items.map((p: { id: string }) => p.id);
  // Bob's posts and Alice's own post should appear
  assert.ok(returnedIds.includes(alicePostId), "Alice's own post should appear in following feed");
  for (const bId of bobPostIds) {
    assert.ok(returnedIds.includes(bId), `Bob's post ${bId} should appear in following feed`);
  }
  // Charlie's posts (unfollowed) must NOT appear
  assert.ok(!returnedIds.includes(charlieLowId), "Unfollowed Charlie's post should not appear in following feed");
  assert.ok(!returnedIds.includes(charlieHighId), "Unfollowed Charlie's post should not appear in following feed");
  // Dave's posts (blocked) must NOT appear
  assert.ok(!returnedIds.includes(davePostId), "Blocked Dave's post must NOT appear in following feed");

  // 2. Following Feed Cursor Pagination
  console.log("2. Testing Following Feed Cursor Pagination...");
  const page1Req = createJsonRequest("/api/v1/feed/following?limit=2", "GET", undefined, { token: aliceToken });
  const page1Res = await getFollowingFeedHandler(page1Req);
  const page1Json = await page1Res.json();
  assert.strictEqual(page1Json.data.items.length, 2);
  assert.strictEqual(page1Json.data.hasMore, true);
  assert.ok(page1Json.data.nextCursor);

  const page2Req = createJsonRequest(`/api/v1/feed/following?limit=2&cursor=${page1Json.data.nextCursor}`, "GET", undefined, { token: aliceToken });
  const page2Res = await getFollowingFeedHandler(page2Req);
  const page2Json = await page2Res.json();
  assert.strictEqual(page2Json.data.items.length, 2);

  // Ensure no duplicate IDs across page 1 and page 2
  const page1Ids = page1Json.data.items.map((p: { id: string }) => p.id);
  const page2Ids = page2Json.data.items.map((p: { id: string }) => p.id);
  for (const id of page1Ids) {
    assert.ok(!page2Ids.includes(id), `Page 2 should not contain item ${id} from Page 1`);
  }

  // 3. For You Feed: Privacy & Block Rules Enforcement
  console.log("3. Testing For You Feed Privacy & Block Rules...");
  const forYouReq = createJsonRequest("/api/v1/feed/for-you", "GET", undefined, { token: aliceToken });
  const forYouRes = await getForYouFeedHandler(forYouReq);
  const forYouJson = await forYouRes.json();
  assert.strictEqual(forYouRes.status, 200);

  const forYouIds: string[] = forYouJson.data.items.map((p: { id: string }) => p.id);
  // Eve's post (private, followed by Alice) MUST appear
  assert.ok(forYouIds.includes(evePostId), "Eve's private post should appear because Alice follows Eve");
  // Frank's post (private, NOT followed by Alice) MUST NOT appear
  assert.ok(!forYouIds.includes(frankPostId), "Frank's private post must NOT appear to non-follower Alice");
  // Dave's post (blocked) MUST NOT appear
  assert.ok(!forYouIds.includes(davePostId), "Blocked Dave's post must NOT appear in For You feed");

  // 4. For You Feed Basic Ranking Verification
  console.log("4. Testing For You Basic Engagement Ranking...");
  // Charlie's high engagement post should rank higher than Charlie's low engagement post
  const charlieHighIndex = forYouIds.indexOf(charlieHighId);
  const charlieLowIndex = forYouIds.indexOf(charlieLowId);
  assert.ok(charlieHighIndex !== -1, "High engagement post should appear in For You feed");
  assert.ok(charlieLowIndex !== -1, "Low engagement post should appear in For You feed");
  assert.ok(
    charlieHighIndex < charlieLowIndex,
    `Viral post (index ${charlieHighIndex}) should rank higher than low-engagement post (index ${charlieLowIndex})`
  );

  // 5. Anonymous For You Feed
  console.log("5. Testing Anonymous Viewer For You Feed (Only public posts appear)...");
  const anonReq = createJsonRequest("/api/v1/feed/for-you", "GET");
  const anonRes = await getForYouFeedHandler(anonReq);
  const anonJson = await anonRes.json();
  assert.ok(anonRes.status === 401 || anonRes.status === 200);

  if (anonRes.status === 200) {
    const anonIds: string[] = anonJson.data.items.map((p: { id: string }) => p.id);
    // Both private posts (Eve and Frank) must be hidden from anonymous viewer
    assert.ok(!anonIds.includes(evePostId), "Eve's private post must NOT appear to anonymous viewer");
    assert.ok(!anonIds.includes(frankPostId), "Frank's private post must NOT appear to anonymous viewer");
    // Public posts should appear
    assert.ok(anonIds.includes(charlieHighId), "Public viral post should appear to anonymous viewer");
  }

  // Clean test data
  await prisma.comment.deleteMany({ where: { author: { email: { in: testEmails } } } });
  await prisma.like.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.savedPost.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.post.deleteMany({ where: { author: { email: { in: testEmails } } } });
  await prisma.follow.deleteMany({ where: { OR: [{ follower: { email: { in: testEmails } } }, { following: { email: { in: testEmails } } }] } });
  await prisma.block.deleteMany({ where: { OR: [{ blocker: { email: { in: testEmails } } }, { blocked: { email: { in: testEmails } } }] } });
  await prisma.privacySettings.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.profile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  console.log("\n>>> ALL PHASE 3 FEED & RANKING TESTS PASSED SUCCESSFULLY! <<<");
}

