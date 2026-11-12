// POPPIN Phase 6: Content & Communication Full End-to-End Integration Suite
// Verifies full integration across Posts, Media, Engagement, Feeds, Messaging, Groups, and Notifications

import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { socketClient } from "../lib/socket-client";

// Handlers
import { POST as createPostHandler } from "../app/api/v1/posts/route";
import { GET as getPostHandler, DELETE as deletePostHandler } from "../app/api/v1/posts/[postId]/route";
import { POST as likePostHandler } from "../app/api/v1/posts/[postId]/like/route";
import { POST as commentPostHandler, GET as getCommentsHandler } from "../app/api/v1/posts/[postId]/comments/route";
import { POST as savePostHandler } from "../app/api/v1/posts/[postId]/save/route";
import { GET as getSavedPostsHandler } from "../app/api/v1/users/me/saved-posts/route";
import { GET as getFollowingFeedHandler } from "../app/api/v1/feed/following/route";
import { GET as getForYouFeedHandler } from "../app/api/v1/feed/for-you/route";
import { POST as followUserHandler } from "../app/api/v1/users/[userId]/follow/route";
import { POST as createConversationHandler } from "../app/api/v1/conversations/route";
import { POST as sendMessageHandler, GET as getMessagesHandler } from "../app/api/v1/conversations/[conversationId]/messages/route";
import { POST as createGroupHandler } from "../app/api/v1/groups/route";
import { DELETE as removeGroupMemberHandler } from "../app/api/v1/groups/[groupId]/members/[userId]/route";
import { GET as getNotificationsHandler } from "../app/api/v1/notifications/route";
import { GET as getUnreadCountHandler } from "../app/api/v1/notifications/unread-count/route";
import { PATCH as markAllReadHandler } from "../app/api/v1/notifications/read-all/route";

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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForNotifications(minCount: number, token: string, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const notifsReq = createJsonRequest("/api/v1/notifications", "GET", undefined, { token });
    const notifsRes = await getNotificationsHandler(notifsReq);
    const notifsJson = await notifsRes.json();
    if (notifsJson.data?.items?.length >= minCount) {
      return notifsJson;
    }
    await delay(100);
  }
  const fallbackReq = createJsonRequest("/api/v1/notifications", "GET", undefined, { token });
  return (await getNotificationsHandler(fallbackReq)).json();
}

export async function runPhase6IntegrationTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 6: E2E INTEGRATION & HARDENING    ");
  console.log("==================================================");

  const testEmails = [
    "p6_alice@poppin.io",
    "p6_bob@poppin.io",
    "p6_charlie@poppin.io",
  ];

  // Clean test database before running
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { recipient: { email: { in: testEmails } } },
        { actor: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.message.deleteMany({
    where: { sender: { email: { in: testEmails } } },
  });
  await prisma.conversationMember.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.conversation.deleteMany({
    where: { members: { some: { user: { email: { in: testEmails } } } } },
  });
  await prisma.savedPost.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.comment.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.like.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.postMedia.deleteMany({
    where: { post: { author: { email: { in: testEmails } } } },
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
  await prisma.profile.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  // Setup test users
  const alice = await prisma.user.create({
    data: {
      email: "p6_alice@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "p6_alice", displayName: "Alice P6" } },
    },
  });
  const aliceToken = signToken({ userId: alice.id, email: alice.email, tokenVersion: 1 });

  const bob = await prisma.user.create({
    data: {
      email: "p6_bob@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "p6_bob", displayName: "Bob P6" } },
    },
  });
  const bobToken = signToken({ userId: bob.id, email: bob.email, tokenVersion: 1 });

  const charlie = await prisma.user.create({
    data: {
      email: "p6_charlie@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "p6_charlie", displayName: "Charlie P6" } },
    },
  });
  const charlieToken = signToken({ userId: charlie.id, email: charlie.email, tokenVersion: 1 });

  // Socket event collector
  const realTimeEvents: Array<{ event: string; data: any }> = [];
  const unsubMsg = socketClient.on("message:new", (data) => realTimeEvents.push({ event: "message:new", data }));
  const unsubNotif = socketClient.on("notification:new", (data) => realTimeEvents.push({ event: "notification:new", data }));

  try {
    // 1. Post Creation with Media, Tags & Project Showcase Type
    console.log("1. E2E: Alice creates a PROJECT_SHOWCASE post with media and tags...");
    const postPayload = {
      content: "Check out our new decentralized protocol! #crypto #buildinpublic",
      type: "PROJECT_SHOWCASE",
      linkUrl: "https://poppin.io/protocol",
      tags: ["crypto", "buildinpublic"],
      media: [
        {
          url: "https://images.poppin.io/architecture.png",
          storageKey: "uploads/architecture.png",
          mimeType: "image/png",
          sizeBytes: 1048576,
          order: 0,
        },
        {
          url: "https://images.poppin.io/benchmarks.png",
          storageKey: "uploads/benchmarks.png",
          mimeType: "image/png",
          sizeBytes: 524288,
          order: 1,
        },
      ],
    };
    const createPostReq = createJsonRequest("/api/v1/posts", "POST", postPayload, { token: aliceToken });
    const createPostRes = await createPostHandler(createPostReq);
    const createPostJson = await createPostRes.json();
    assert.strictEqual(createPostRes.status, 201);
    const postId = createPostJson.data.id;
    assert.strictEqual(createPostJson.data.type, "PROJECT_SHOWCASE");
    assert.strictEqual(createPostJson.data.media.length, 2);
    assert.strictEqual(createPostJson.data.media[0].order, 0);
    assert.strictEqual(createPostJson.data.media[1].order, 1);

    // 2. Follow Integration & Following Feed
    console.log("2. E2E: Bob follows Alice and views Following feed...");
    const followReq = createJsonRequest(`/api/v1/users/${alice.id}/follow`, "POST", {}, { token: bobToken });
    const followRes = await followUserHandler(followReq, { params: Promise.resolve({ userId: alice.id }) });
    assert.strictEqual(followRes.status, 201);

    const followingFeedReq = createJsonRequest("/api/v1/feed/following", "GET", undefined, { token: bobToken });
    const followingFeedRes = await getFollowingFeedHandler(followingFeedReq);
    const followingFeedJson = await followingFeedRes.json();
    assert.strictEqual(followingFeedRes.status, 200);
    assert.ok(followingFeedJson.data.items.some((p: any) => p.id === postId));

    // 3. Engagement: Bob likes and saves the post
    console.log("3. E2E: Bob likes and saves Alice's post...");
    const likeReq = createJsonRequest(`/api/v1/posts/${postId}/like`, "POST", {}, { token: bobToken });
    const likeRes = await likePostHandler(likeReq, { params: Promise.resolve({ postId }) });
    assert.strictEqual(likeRes.status, 200);

    const saveReq = createJsonRequest(`/api/v1/posts/${postId}/save`, "POST", {}, { token: bobToken });
    const saveRes = await savePostHandler(saveReq, { params: Promise.resolve({ postId }) });
    assert.strictEqual(saveRes.status, 200);

    // Check Bob's saved posts
    const savedReq = createJsonRequest("/api/v1/users/me/saved-posts", "GET", undefined, { token: bobToken });
    const savedRes = await getSavedPostsHandler(savedReq);
    const savedJson = await savedRes.json();
    assert.strictEqual(savedRes.status, 200);
    assert.strictEqual(savedJson.data.items.length, 1);
    assert.strictEqual(savedJson.data.items[0].id, postId);

    // 4. Comments & Strict 1-Level Nesting Check
    console.log("4. E2E: Comments tree & strict 1-level reply enforcement...");
    // Bob leaves top-level comment
    const comment1Req = createJsonRequest(
      `/api/v1/posts/${postId}/comments`,
      "POST",
      { content: "Groundbreaking architecture Alice!" },
      { token: bobToken }
    );
    const comment1Res = await commentPostHandler(comment1Req, { params: Promise.resolve({ postId }) });
    const comment1Json = await comment1Res.json();
    assert.strictEqual(comment1Res.status, 201);
    const topCommentId = comment1Json.data.id;

    // Alice replies to Bob (1-level reply)
    const replyReq = createJsonRequest(
      `/api/v1/posts/${postId}/comments`,
      "POST",
      { content: "Thanks Bob! Benchmarks speak for themselves.", replyToCommentId: topCommentId },
      { token: aliceToken }
    );
    const replyRes = await commentPostHandler(replyReq, { params: Promise.resolve({ postId }) });
    const replyJson = await replyRes.json();
    assert.strictEqual(replyRes.status, 201);
    const replyId = replyJson.data.id;
    assert.strictEqual(replyJson.data.replyToCommentId, topCommentId);

    // Charlie attempts to reply to Alice's reply (level 2) -> MUST BE REJECTED with 400
    const invalidDeepReplyReq = createJsonRequest(
      `/api/v1/posts/${postId}/comments`,
      "POST",
      { content: "Can I reply to your reply?", replyToCommentId: replyId },
      { token: charlieToken }
    );
    const invalidDeepReplyRes = await commentPostHandler(invalidDeepReplyReq, { params: Promise.resolve({ postId }) });
    assert.strictEqual(invalidDeepReplyRes.status, 400);
    const invalidDeepReplyJson = await invalidDeepReplyRes.json();
    assert.strictEqual(invalidDeepReplyJson.error.code, "NESTED_REPLIES_NOT_ALLOWED");

    // 5. Notifications Check
    console.log("5. E2E: Alice verifies received in-app notifications (Follow, Like, Comment)...");
    const notifsJson = await waitForNotifications(3, aliceToken);
    assert.ok(notifsJson.data.items.length >= 3);

    // Verify unread count and mark-all-as-read
    const unreadReq = createJsonRequest("/api/v1/notifications/unread-count", "GET", undefined, { token: aliceToken });
    const unreadRes = await getUnreadCountHandler(unreadReq);
    const unreadJson = await unreadRes.json();
    assert.ok(unreadJson.data.unreadCount >= 3);

    const markAllReq = createJsonRequest("/api/v1/notifications/read-all", "PATCH", {}, { token: aliceToken });
    const markAllRes = await markAllReadHandler(markAllReq);
    assert.strictEqual(markAllRes.status, 200);

    const unreadAfterRes = await getUnreadCountHandler(unreadReq);
    const unreadAfterJson = await unreadAfterRes.json();
    assert.strictEqual(unreadAfterJson.data.unreadCount, 0);

    // 6. Messaging & Group Chat Lifecycle
    console.log("6. E2E: Realtime Group Chat, Admin Permissions & Member Management...");
    // Alice creates group with Bob and Charlie
    const groupReq = createJsonRequest(
      "/api/v1/groups",
      "POST",
      { name: "Decentralized Devs", memberIds: [bob.id, charlie.id] },
      { token: aliceToken }
    );
    const groupRes = await createGroupHandler(groupReq);
    const groupJson = await groupRes.json();
    assert.strictEqual(groupRes.status, 201);
    const groupId = groupJson.data.id;

    // Send a message to the group
    const msgReq = createJsonRequest(
      `/api/v1/conversations/${groupId}/messages`,
      "POST",
      { content: "Welcome everyone to Decentralized Devs!" },
      { token: aliceToken }
    );
    const msgRes = await sendMessageHandler(msgReq, { params: Promise.resolve({ conversationId: groupId }) });
    assert.strictEqual(msgRes.status, 201);

    // Bob views message history
    const getMsgsReq = createJsonRequest(`/api/v1/conversations/${groupId}/messages`, "GET", undefined, { token: bobToken });
    const getMsgsRes = await getMessagesHandler(getMsgsReq, { params: Promise.resolve({ conversationId: groupId }) });
    const getMsgsJson = await getMsgsRes.json();
    assert.strictEqual(getMsgsRes.status, 200);
    assert.strictEqual(getMsgsJson.data.items.length, 1);

    // Charlie (non-admin member) attempts to remove Bob -> MUST BE FORBIDDEN (403)
    const unauthorizedRemoveReq = createJsonRequest(
      `/api/v1/groups/${groupId}/members/${bob.id}`,
      "DELETE",
      undefined,
      { token: charlieToken }
    );
    const unauthorizedRemoveRes = await removeGroupMemberHandler(unauthorizedRemoveReq, {
      params: Promise.resolve({ groupId, userId: bob.id }),
    });
    assert.strictEqual(unauthorizedRemoveRes.status, 403);

    // Alice (admin) removes Charlie -> SUCCESS (200)
    const adminRemoveReq = createJsonRequest(
      `/api/v1/groups/${groupId}/members/${charlie.id}`,
      "DELETE",
      undefined,
      { token: aliceToken }
    );
    const adminRemoveRes = await removeGroupMemberHandler(adminRemoveReq, {
      params: Promise.resolve({ groupId, userId: charlie.id }),
    });
    assert.strictEqual(adminRemoveRes.status, 200);

    // 7. Cleanup & Cascade Verification
    console.log("7. E2E: Post Deletion & Cascade cleanup of Comments, Likes and Saves...");
    const deletePostReq = createJsonRequest(`/api/v1/posts/${postId}`, "DELETE", undefined, { token: aliceToken });
    const deletePostRes = await deletePostHandler(deletePostReq, { params: Promise.resolve({ postId }) });
    assert.strictEqual(deletePostRes.status, 200);

    // Verify post is gone
    const checkPostReq = createJsonRequest(`/api/v1/posts/${postId}`, "GET");
    const checkPostRes = await getPostHandler(checkPostReq, { params: Promise.resolve({ postId }) });
    assert.strictEqual(checkPostRes.status, 404);

    // Verify likes and comments were cascade deleted
    const remainingLikes = await prisma.like.count({ where: { postId } });
    const remainingComments = await prisma.comment.count({ where: { postId } });
    assert.strictEqual(remainingLikes, 0);
    assert.strictEqual(remainingComments, 0);

    console.log("\n Phase 6 Integration & Hardening Suite PASSED successfully!");
  } finally {
    unsubMsg();
    unsubNotif();
    // Cleanup test users and data
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipient: { email: { in: testEmails } } },
          { actor: { email: { in: testEmails } } },
        ],
      },
    });
    await prisma.message.deleteMany({
      where: { sender: { email: { in: testEmails } } },
    });
    await prisma.conversationMember.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.conversation.deleteMany({
      where: { members: { some: { user: { email: { in: testEmails } } } } },
    });
    await prisma.savedPost.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.comment.deleteMany({
      where: { author: { email: { in: testEmails } } },
    });
    await prisma.like.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.postMedia.deleteMany({
      where: { post: { author: { email: { in: testEmails } } } },
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
    await prisma.profile.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
  }
}

if (require.main === module) {
  runPhase6IntegrationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
