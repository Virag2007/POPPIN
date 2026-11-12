// POPPIN Phase 0 Contract & Setup Verification Suite
// Verifies platform database models, types, storage abstraction, and API/Socket client contracts

import assert from "node:assert";
import { prisma } from "../lib/db";
import { getStorageProvider } from "../lib/storage";
import { PoppinApiClient } from "../lib/api-client";
import { PoppinSocketClient } from "../lib/socket-client";

export async function runPhase0ContractTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 0: CONTRACTS & SETUP TESTS       ");
  console.log("==================================================");

  // 1. Verify Clean Database Integration with User Model
  console.log("1. Testing Models & Foreign Key Integration with User Model...");
  const existingUnified = await prisma.user.findUnique({
    where: { email: "unified_contracts_user@poppin.io" },
  });
  if (existingUnified) {
    await prisma.user.delete({ where: { id: existingUnified.id } });
  }
  const unifiedTestUser = await prisma.user.create({
    data: {
      email: "unified_contracts_user@poppin.io",
      tokenVersion: 1,
    },
  });
  assert.ok(unifiedTestUser.id);

  // Test Post & PostMedia Model creation
  const testPost = await prisma.post.create({
    data: {
      authorId: unifiedTestUser.id,
      content: "Hello POPPIN World! #setup #phase0",
      type: "PROJECT_SHOWCASE",
      tags: JSON.stringify(["setup", "phase0"]),
      links: JSON.stringify([{ title: "GitHub", url: "https://github.com/poppin" }]),
      media: {
        create: [
          {
            url: "https://storage.poppin.io/demo1.jpg",
            key: "demo1_key",
            mimeType: "image/jpeg",
            size: 1024,
            order: 0,
          },
          {
            url: "https://storage.poppin.io/demo2.jpg",
            key: "demo2_key",
            mimeType: "image/jpeg",
            size: 2048,
            order: 1,
          },
        ],
      },
    },
    include: {
      media: true,
    },
  });
  assert.strictEqual(testPost.type, "PROJECT_SHOWCASE");
  assert.strictEqual(testPost.media.length, 2);
  assert.strictEqual(testPost.media[0].order, 0);
  assert.strictEqual(testPost.media[1].order, 1);

  // Test Like Model
  const testLike = await prisma.like.create({
    data: {
      userId: unifiedTestUser.id,
      postId: testPost.id,
    },
  });
  assert.ok(testLike.id);

  // Test Comment Model with 1-level reply hierarchy
  const parentComment = await prisma.comment.create({
    data: {
      postId: testPost.id,
      authorId: unifiedTestUser.id,
      content: "Top level comment",
    },
  });

  const replyComment = await prisma.comment.create({
    data: {
      postId: testPost.id,
      authorId: unifiedTestUser.id,
      content: "1-level reply to parent comment",
      replyToCommentId: parentComment.id,
    },
  });
  assert.strictEqual(replyComment.replyToCommentId, parentComment.id);

  // Test SavedPost Model
  const testSave = await prisma.savedPost.create({
    data: {
      userId: unifiedTestUser.id,
      postId: testPost.id,
    },
  });
  assert.ok(testSave.id);

  // Test Conversation & Message Models
  const testConversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: "Community Group",
      members: {
        create: {
          userId: unifiedTestUser.id,
          role: "ADMIN",
        },
      },
    },
    include: {
      members: true,
    },
  });
  assert.strictEqual(testConversation.isGroup, true);
  assert.strictEqual(testConversation.members[0].role, "ADMIN");

  const testMessage = await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: unifiedTestUser.id,
      content: "First setup message",
    },
  });
  assert.strictEqual(testMessage.content, "First setup message");

  // Test Notification Model
  const testNotification = await prisma.notification.create({
    data: {
      recipientId: unifiedTestUser.id,
      actorId: unifiedTestUser.id,
      type: "NEW_FOLLOWER",
      entityId: unifiedTestUser.id,
    },
  });
  assert.strictEqual(testNotification.type, "NEW_FOLLOWER");
  assert.strictEqual(testNotification.isRead, false);

  // 2. Storage Adapter Verification
  console.log("2. Testing Storage Provider Adapter & Media Metadata...");
  const storage = getStorageProvider();
  const sampleBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );
  const uploadResult = await storage.upload(sampleBuffer, "test_pic.png", "image/png");

  assert.ok(uploadResult.url.startsWith("https://"));
  assert.ok(uploadResult.key.length > 0);
  assert.ok(uploadResult.size > 0);
  assert.strictEqual(uploadResult.mimeType, "image/png");
  await storage.delete(uploadResult.key);

  // 3. API Client Initialization & Typing Contract
  console.log("3. Testing Poppin API Client Configuration & Contract Structure...");
  const client = new PoppinApiClient({
    baseUrl: "http://localhost:3000",
    getToken: () => "mock-jwt-token",
  });
  assert.ok(typeof client.createPost === "function");
  assert.ok(typeof client.likePost === "function");
  assert.ok(typeof client.getFollowingFeed === "function");
  assert.ok(typeof client.sendMessage === "function");
  assert.ok(typeof client.getNotifications === "function");

  // 4. Socket Client Event Subscription & Dispatching
  console.log("4. Testing Real-time Socket Client Event Abstraction...");
  const socket = new PoppinSocketClient();
  let receivedMessage: any = null;

  const unsubscribe = socket.on("message:new", (data) => {
    receivedMessage = data;
  });

  socket._dispatchServerEvent("message:new", {
    id: "msg_123",
    content: "Realtime hello",
  });

  assert.deepStrictEqual(receivedMessage, {
    id: "msg_123",
    content: "Realtime hello",
  });

  unsubscribe();
  receivedMessage = null;
  socket._dispatchServerEvent("message:new", { content: "Should not be received" });
  assert.strictEqual(receivedMessage, null, "Unsubscribe must remove listener");

  // Cleanup Phase 0 test records
  await prisma.notification.deleteMany({ where: { recipientId: unifiedTestUser.id } });
  await prisma.message.deleteMany({ where: { conversationId: testConversation.id } });
  await prisma.conversationMember.deleteMany({ where: { conversationId: testConversation.id } });
  await prisma.conversation.delete({ where: { id: testConversation.id } });
  await prisma.savedPost.deleteMany({ where: { userId: unifiedTestUser.id } });
  await prisma.comment.deleteMany({ where: { postId: testPost.id } });
  await prisma.like.deleteMany({ where: { postId: testPost.id } });
  await prisma.postMedia.deleteMany({ where: { postId: testPost.id } });
  await prisma.post.delete({ where: { id: testPost.id } });
  await prisma.user.delete({ where: { id: unifiedTestUser.id } });

  console.log("\n>>> ALL PHASE 0 CONTRACT & SETUP TESTS PASSED SUCCESSFULLY! <<<\n");
}

if (process.argv[1]?.includes("phase0-contracts.test")) {
  runPhase0ContractTests()
    .catch((err) => {
      console.error("Phase 0 test failure:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

