// POPPIN Phase 5: Notifications Verification Suite
// Verifies In-App Notifications for Likes, Comments, Follows, Messages, Unread Counts, Read State Management, and Realtime Broadcasts

import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { socketClient } from "../lib/socket-client";
import { NotificationService } from "../services/notification.service";
import { GET as getNotificationsHandler } from "../app/api/v1/notifications/route";
import { GET as getUnreadCountHandler } from "../app/api/v1/notifications/unread-count/route";
import { PATCH as markNotificationReadHandler } from "../app/api/v1/notifications/[notificationId]/read/route";
import { PATCH as markAllReadHandler } from "../app/api/v1/notifications/read-all/route";
import { POST as likePostHandler } from "../app/api/v1/posts/[postId]/like/route";
import { POST as commentPostHandler } from "../app/api/v1/posts/[postId]/comments/route";
import { POST as followUserHandler } from "../app/api/v1/users/[userId]/follow/route";
import { POST as sendMessageHandler } from "../app/api/v1/conversations/[conversationId]/messages/route";
import { POST as createConversationHandler } from "../app/api/v1/conversations/route";

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

async function waitForUnreadCount(expectedCount: number, token: string, timeoutMs = 4000): Promise<number> {
  const start = Date.now();
  let count = -1;
  while (Date.now() - start < timeoutMs) {
    const res = await getUnreadCountHandler(
      createJsonRequest("/api/v1/notifications/unread-count", "GET", undefined, { token })
    );
    const json = await res.json();
    count = json.data?.unreadCount ?? -1;
    if (count === expectedCount) return count;
    await delay(100);
  }
  return count;
}

export async function runPhase5NotificationsTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 5: NOTIFICATIONS TESTS           ");
  console.log("==================================================");

  const testEmails = [
    "notif_alice@poppin.io",
    "notif_bob@poppin.io",
    "notif_charlie@poppin.io",
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
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { follower: { email: { in: testEmails } } },
        { following: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.comment.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.like.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.post.deleteMany({
    where: { author: { email: { in: testEmails } } },
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
      email: "notif_alice@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "notif_alice", displayName: "Alice Notif" } },
    },
  });
  const aliceToken = signToken({ userId: alice.id, email: alice.email, tokenVersion: 1 });

  const bob = await prisma.user.create({
    data: {
      email: "notif_bob@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "notif_bob", displayName: "Bob Notif" } },
    },
  });
  const bobToken = signToken({ userId: bob.id, email: bob.email, tokenVersion: 1 });

  const charlie = await prisma.user.create({
    data: {
      email: "notif_charlie@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "notif_charlie", displayName: "Charlie Notif" } },
    },
  });
  const charlieToken = signToken({ userId: charlie.id, email: charlie.email, tokenVersion: 1 });

  // Setup a test post authored by Alice
  const post = await prisma.post.create({
    data: {
      authorId: alice.id,
      content: "Alice's amazing post for notification testing",
      type: "UPDATE",
    },
  });

  // Setup socket listener capture
  const receivedNotifications: any[] = [];
  const unsubscribe = socketClient.on("notification:new", (data) => {
    receivedNotifications.push(data);
  });

  try {
    // 1. Post Like Notification Trigger & Self-Notification Prevention
    console.log("1. Testing Post Like Notification Trigger...");

    // Alice likes her own post -> should NOT create notification
    const selfLikeReq = createJsonRequest(`/api/v1/posts/${post.id}/like`, "POST", {}, { token: aliceToken });
    const selfLikeRes = await likePostHandler(selfLikeReq, {
      params: Promise.resolve({ postId: post.id }),
    });
    assert.strictEqual(selfLikeRes.status, 200);
    await delay(100);

    let aliceUnreadRes = await getUnreadCountHandler(
      createJsonRequest("/api/v1/notifications/unread-count", "GET", undefined, { token: aliceToken })
    );
    let aliceUnreadJson = await aliceUnreadRes.json();
    assert.strictEqual(aliceUnreadJson.data.unreadCount, 0, "Self-like must not create notification");

    // Bob likes Alice's post -> SHOULD create notification for Alice
    const bobLikeReq = createJsonRequest(`/api/v1/posts/${post.id}/like`, "POST", {}, { token: bobToken });
    const bobLikeRes = await likePostHandler(bobLikeReq, {
      params: Promise.resolve({ postId: post.id }),
    });
    assert.strictEqual(bobLikeRes.status, 200);
    const unreadAfterLike = await waitForUnreadCount(1, aliceToken);
    assert.strictEqual(unreadAfterLike, 1, "Bob's like must increment Alice's unread count to 1");

    // 2. Post Comment Notification Trigger & Self-Notification Prevention
    console.log("2. Testing Post Comment Notification Trigger...");

    // Alice comments on her own post -> should NOT create notification
    const selfCommentReq = createJsonRequest(
      `/api/v1/posts/${post.id}/comments`,
      "POST",
      { content: "My own comment" },
      { token: aliceToken }
    );
    const selfCommentRes = await commentPostHandler(selfCommentReq, {
      params: Promise.resolve({ postId: post.id }),
    });
    assert.strictEqual(selfCommentRes.status, 201);
    await delay(100);

    aliceUnreadRes = await getUnreadCountHandler(
      createJsonRequest("/api/v1/notifications/unread-count", "GET", undefined, { token: aliceToken })
    );
    aliceUnreadJson = await aliceUnreadRes.json();
    assert.strictEqual(aliceUnreadJson.data.unreadCount, 1, "Self-comment must not create notification");

    // Bob comments on Alice's post -> SHOULD create notification for Alice
    const bobCommentReq = createJsonRequest(
      `/api/v1/posts/${post.id}/comments`,
      "POST",
      { content: "Awesome post Alice!" },
      { token: bobToken }
    );
    const bobCommentRes = await commentPostHandler(bobCommentReq, {
      params: Promise.resolve({ postId: post.id }),
    });
    assert.strictEqual(bobCommentRes.status, 201);
    const unreadAfterComment = await waitForUnreadCount(2, aliceToken);
    assert.strictEqual(unreadAfterComment, 2, "Bob's comment must increment Alice's unread count to 2");

    // 3. New Follower Notification Trigger
    console.log("3. Testing New Follower Notification Trigger...");
    const followReq = createJsonRequest(
      `/api/v1/users/${alice.id}/follow`,
      "POST",
      {},
      { token: bobToken }
    );
    const followRes = await followUserHandler(followReq, {
      params: Promise.resolve({ userId: alice.id }),
    });
    assert.strictEqual(followRes.status, 201);
    const unreadAfterFollow = await waitForUnreadCount(3, aliceToken);
    assert.strictEqual(unreadAfterFollow, 3, "New follower must increment Alice's unread count to 3");

    // 4. New Message Notification Trigger
    console.log("4. Testing New Message Notification Trigger...");
    // Create conversation between Alice and Charlie
    const convReq = createJsonRequest(
      "/api/v1/conversations",
      "POST",
      { recipientId: charlie.id },
      { token: aliceToken }
    );
    const convRes = await createConversationHandler(convReq);
    const convJson = await convRes.json();
    const conversationId = convJson.data.id;

    // Charlie sends message to Alice -> Alice should receive NEW_MESSAGE notification
    const msgReq = createJsonRequest(
      `/api/v1/conversations/${conversationId}/messages`,
      "POST",
      { content: "Hey Alice, checking in!" },
      { token: charlieToken }
    );
    const msgRes = await sendMessageHandler(msgReq, {
      params: Promise.resolve({ conversationId }),
    });
    assert.strictEqual(msgRes.status, 201);
    const unreadAfterMessage = await waitForUnreadCount(4, aliceToken);
    assert.strictEqual(unreadAfterMessage, 4, "New message must increment Alice's unread count to 4");

    // Check socket notifications received
    assert.ok(receivedNotifications.length >= 4, "Realtime socket broadcaster must deliver notifications");

    // 5. Notifications List & Pagination
    console.log("5. Testing Notifications List & Pagination...");
    // Fetch with limit = 2
    const listReq1 = createJsonRequest(
      "/api/v1/notifications?limit=2",
      "GET",
      undefined,
      { token: aliceToken }
    );
    const listRes1 = await getNotificationsHandler(listReq1);
    const listJson1 = await listRes1.json();
    assert.strictEqual(listRes1.status, 200);
    assert.strictEqual(listJson1.data.items.length, 2);
    assert.strictEqual(listJson1.data.hasMore, true);
    assert.ok(listJson1.data.nextCursor);

    // Verify notification structure
    const firstNotif = listJson1.data.items[0];
    assert.ok(firstNotif.id);
    assert.strictEqual(firstNotif.recipientId, alice.id);
    assert.ok(firstNotif.actor);
    assert.ok(firstNotif.actor.username);
    assert.strictEqual(firstNotif.isRead, false);

    // Fetch page 2 using cursor
    const listReq2 = createJsonRequest(
      `/api/v1/notifications?limit=2&cursor=${listJson1.data.nextCursor}`,
      "GET",
      undefined,
      { token: aliceToken }
    );
    const listRes2 = await getNotificationsHandler(listReq2);
    const listJson2 = await listRes2.json();
    assert.strictEqual(listRes2.status, 200);
    assert.strictEqual(listJson2.data.items.length, 2);

    // Total notifications across pages should be distinct
    const idsPage1 = new Set(listJson1.data.items.map((n: any) => n.id));
    for (const item of listJson2.data.items) {
      assert.ok(!idsPage1.has(item.id), "Cursor pagination must not produce duplicate records");
    }

    // 6. Mark Individual Notification as Read & Access Control
    console.log("6. Testing Mark Single Notification as Read...");
    const targetNotifId = listJson1.data.items[0].id;

    // Bob trying to mark Alice's notification as read -> should fail 404
    const bobMarkReq = createJsonRequest(
      `/api/v1/notifications/${targetNotifId}/read`,
      "PATCH",
      {},
      { token: bobToken }
    );
    const bobMarkRes = await markNotificationReadHandler(bobMarkReq, {
      params: Promise.resolve({ notificationId: targetNotifId }),
    });
    assert.strictEqual(bobMarkRes.status, 404, "Non-recipient must not be able to mark notification as read");

    // Alice marks her notification as read -> should succeed
    const aliceMarkReq = createJsonRequest(
      `/api/v1/notifications/${targetNotifId}/read`,
      "PATCH",
      {},
      { token: aliceToken }
    );
    const aliceMarkRes = await markNotificationReadHandler(aliceMarkReq, {
      params: Promise.resolve({ notificationId: targetNotifId }),
    });
    assert.strictEqual(aliceMarkRes.status, 200);

    // Verify unread count decremented from 4 to 3
    aliceUnreadRes = await getUnreadCountHandler(
      createJsonRequest("/api/v1/notifications/unread-count", "GET", undefined, { token: aliceToken })
    );
    aliceUnreadJson = await aliceUnreadRes.json();
    assert.strictEqual(aliceUnreadJson.data.unreadCount, 3, "Unread count must decrement after marking item as read");

    // 7. Mark All Notifications as Read
    console.log("7. Testing Mark All Notifications as Read...");
    const markAllReq = createJsonRequest(
      "/api/v1/notifications/read-all",
      "PATCH",
      {},
      { token: aliceToken }
    );
    const markAllRes = await markAllReadHandler(markAllReq);
    const markAllJson = await markAllRes.json();
    assert.strictEqual(markAllRes.status, 200);
    assert.strictEqual(markAllJson.data.markedCount, 3, "Mark all should mark remaining 3 unread notifications");

    // Verify unread count is now 0
    aliceUnreadRes = await getUnreadCountHandler(
      createJsonRequest("/api/v1/notifications/unread-count", "GET", undefined, { token: aliceToken })
    );
    aliceUnreadJson = await aliceUnreadRes.json();
    assert.strictEqual(aliceUnreadJson.data.unreadCount, 0, "Unread count must be 0 after mark-all");

    // 8. Auth Enforcement
    console.log("8. Testing Unauthenticated Request Rejection...");
    const unauthReq = createJsonRequest("/api/v1/notifications", "GET");
    const unauthRes = await getNotificationsHandler(unauthReq);
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated request must be rejected with 401");

    console.log("\n Phase 5 Notifications Tests PASSED successfully!");
  } finally {
    unsubscribe();
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
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { follower: { email: { in: testEmails } } },
          { following: { email: { in: testEmails } } },
        ],
      },
    });
    await prisma.comment.deleteMany({
      where: { author: { email: { in: testEmails } } },
    });
    await prisma.like.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.post.deleteMany({
      where: { author: { email: { in: testEmails } } },
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
  runPhase5NotificationsTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
