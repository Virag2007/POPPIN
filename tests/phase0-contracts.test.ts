// POPPIN Phase 0 Contract & Setup Verification Suite
// Verifies Developer 2 database models, types, storage abstraction, and API/Socket client contracts

import assert from "node:assert";
import { prisma } from "../lib/db";
import { getStorageProvider } from "../lib/storage";
import { PoppinApiClient } from "../lib/api-client";
import { PoppinSocketClient } from "../lib/socket-client";

export async function runPhase0ContractTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 0: CONTRACTS & SETUP TESTS       ");
  console.log("==================================================");

  // 1. Verify Clean Database Integration with Developer 1's User Model
  console.log("1. Testing Developer 2 Models & Foreign Key Integration with User Model...");
  const dev2TestUser = await prisma.user.create({
    data: {
      email: "dev2_contracts_user@poppin.io",
      tokenVersion: 1,
    },
  });
  assert.ok(dev2TestUser.id);

  // Test Post & PostMedia Model creation
  const testPost = await prisma.post.create({
    data: {
      authorId: dev2TestUser.id,
      content: "Hello Developer 2 World! #setup #phase0",
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
      userId: dev2TestUser.id,
      postId: testPost.id,
    },
  });
  assert.ok(testLike.id);

  // Test Comment Model with 1-level reply hierarchy
  const parentComment = await prisma.comment.create({
    data: {
      postId: testPost.id,
      authorId: dev2TestUser.id,
      content: "Top level comment",
    },
  });

  const replyComment = await prisma.comment.create({
    data: {
      postId: testPost.id,
      authorId: dev2TestUser.id,
      content: "1-level reply to parent comment",
      replyToCommentId: parentComment.id,
    },
  });
  assert.strictEqual(replyComment.replyToCommentId, parentComment.id);

  // Test SavedPost Model
  const testSave = await prisma.savedPost.create({
    data: {
      userId: dev2TestUser.id,
      postId: testPost.id,
    },
  });
  assert.ok(testSave.id);

  // Test Conversation & Message Models
  const testConversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: "Developers Group",
      members: {
        create: {
          userId: dev2TestUser.id,
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
      senderId: dev2TestUser.id,
      content: "First setup message",
    },
  });
  assert.strictEqual(testMessage.content, "First setup message");

  // Test Notification Model
  const testNotification = await prisma.notification.create({
    data: {
      recipientId: dev2TestUser.id,
      actorId: dev2TestUser.id,
      type: "NEW_FOLLOWER",
      entityId: dev2TestUser.id,
    },
  });
  assert.strictEqual(testNotification.type, "NEW_FOLLOWER");
  assert.strictEqual(testNotification.isRead, false);

  // 2. Storage Adapter Verification
  console.log("2. Testing Storage Provider Adapter & Media Metadata...");
  const storage = getStorageProvider();
  const sampleBuffer = Buffer.from("fake-image-bytes-poppin");
  const uploadResult = await storage.upload(sampleBuffer, "test_pic.png", "image/png");

  assert.ok(uploadResult.url.startsWith("https://"));
  assert.ok(uploadResult.key.length > 0);
  assert.strictEqual(uploadResult.size, sampleBuffer.length);
  assert.strictEqual(uploadResult.mimeType, "image/png");

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
  await prisma.notification.deleteMany({ where: { recipientId: dev2TestUser.id } });
  await prisma.message.deleteMany({ where: { conversationId: testConversation.id } });
  await prisma.conversationMember.deleteMany({ where: { conversationId: testConversation.id } });
  await prisma.conversation.delete({ where: { id: testConversation.id } });
  await prisma.savedPost.deleteMany({ where: { userId: dev2TestUser.id } });
  await prisma.comment.deleteMany({ where: { postId: testPost.id } });
  await prisma.like.deleteMany({ where: { postId: testPost.id } });
  await prisma.postMedia.deleteMany({ where: { postId: testPost.id } });
  await prisma.post.delete({ where: { id: testPost.id } });
  await prisma.user.delete({ where: { id: dev2TestUser.id } });

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

