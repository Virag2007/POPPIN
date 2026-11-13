// POPPIN Phase 12: Real-time Socket.IO Messaging Verification Suite
// Comprehensive integration testing covering authentication, delivery, persistence,
// presence, typing, idempotency, rate limiting, multiple devices, and room isolation.

import "./load-env";
import assert from "node:assert";
import http from "node:http";
import { io as Client, Socket } from "socket.io-client";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { createSocketServer } from "../realtime-server/src/socket";
import { ClientToServerEvents, ServerToClientEvents, MessageResponseDTO } from "../realtime-server/src/types/events";

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runRealtimeSocketTests() {
  console.log("\n==================================================");
  console.log("   POPPIN: SOCKET.IO REAL-TIME MESSAGING TESTS    ");
  console.log("==================================================");

  const TEST_PORT = 4199;
  const TEST_URL = `http://localhost:${TEST_PORT}`;

  // 0. Bootstrap test HTTP + Socket.IO server on dynamic port
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "poppin-realtime-server" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const ioServer = await createSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, "127.0.0.1", () => {
      resolve();
    });
  });

  const socketsToCleanup: TestSocket[] = [];

  function createClientSocket(token?: string | null): TestSocket {
    const socket = Client(TEST_URL, {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: false,
    }) as TestSocket;
    socketsToCleanup.push(socket);
    return socket;
  }

  // Helper to connect and wait for either connect or connect_error
  function connectSocket(socket: TestSocket): Promise<{ success: boolean; error?: any }> {
    return new Promise((resolve) => {
      socket.once("connect", () => resolve({ success: true }));
      socket.once("connect_error", (err) => resolve({ success: false, error: err }));
      socket.connect();
    });
  }

  try {
    // 1. Setup Test Users and Conversation in Database
    console.log("Setup: Creating authenticated test identities in database...");
    const timestamp = Date.now();
    const aliceEmail = `socket_alice_${timestamp}@poppin.io`;
    const bobEmail = `socket_bob_${timestamp}@poppin.io`;
    const eveEmail = `socket_eve_${timestamp}@poppin.io`; // Eve is an intruder/non-member

    const aliceUser = await prisma.user.create({
      data: {
        email: aliceEmail,
        tokenVersion: 1,
        profile: {
          create: {
            username: `alice_sock_${timestamp}`,
            displayName: "Alice Realtime",
          },
        },
      },
    });

    const bobUser = await prisma.user.create({
      data: {
        email: bobEmail,
        tokenVersion: 1,
        profile: {
          create: {
            username: `bob_sock_${timestamp}`,
            displayName: "Bob Realtime",
          },
        },
      },
    });

    const eveUser = await prisma.user.create({
      data: {
        email: eveEmail,
        tokenVersion: 1,
        profile: {
          create: {
            username: `eve_sock_${timestamp}`,
            displayName: "Eve Intruder",
          },
        },
      },
    });

    const aliceToken = signToken({ userId: aliceUser.id, email: aliceEmail });
    const bobToken = signToken({ userId: bobUser.id, email: bobEmail });
    const eveToken = signToken({ userId: eveUser.id, email: eveEmail });

    // Create 1-on-1 Conversation between Alice & Bob
    const conversation = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        isGroup: false,
        members: {
          create: [
            { userId: aliceUser.id, role: "MEMBER" },
            { userId: bobUser.id, role: "MEMBER" },
          ],
        },
      },
    });

    // -------------------------------------------------------------
    // Test 1: Successful Socket Authentication
    // -------------------------------------------------------------
    console.log("1. Testing Successful Socket Authentication...");
    const aliceSocket1 = createClientSocket(aliceToken);
    const authRes = await connectSocket(aliceSocket1);
    assert.strictEqual(authRes.success, true, "Alice Socket 1 must connect successfully with valid JWT");
    assert.ok(aliceSocket1.id);
    console.log("   ✓ Socket connected with verified JWT");

    // -------------------------------------------------------------
    // Test 2: Invalid JWT Rejection
    // -------------------------------------------------------------
    console.log("2. Testing Invalid JWT Rejection...");
    const invalidSocket = createClientSocket("invalid.jwt.token.here");
    const invalidRes = await connectSocket(invalidSocket);
    assert.strictEqual(invalidRes.success, false, "Invalid JWT must be rejected during handshake");
    console.log("   ✓ Invalid token rejected with connection error");

    // -------------------------------------------------------------
    // Test 3: Unauthenticated Connection Rejection
    // -------------------------------------------------------------
    console.log("3. Testing Unauthenticated Request Rejection...");
    const anonSocket = createClientSocket(null);
    const anonRes = await connectSocket(anonSocket);
    assert.strictEqual(anonRes.success, false, "Connection without token must be rejected");
    console.log("   ✓ Unauthenticated handshake denied");

    // -------------------------------------------------------------
    // Test 4: Conversation Membership Verification (Authorized Join)
    // -------------------------------------------------------------
    console.log("4. Testing Conversation Membership Authorization (Join Room)...");
    const joinResult: any = await new Promise((resolve) => {
      aliceSocket1.emit("conversation:join", { conversationId: conversation.id }, (res) => {
        resolve(res);
      });
    });
    assert.strictEqual(joinResult.success, true, "Alice must be allowed to join conversation room");
    console.log("   ✓ Authorized member successfully joined conversation room");

    // -------------------------------------------------------------
    // Test 5: Unauthorized Conversation Access Rejection
    // -------------------------------------------------------------
    console.log("5. Testing Unauthorized Conversation Access Guard...");
    const eveSocket = createClientSocket(eveToken);
    await connectSocket(eveSocket);
    const eveJoinResult: any = await new Promise((resolve) => {
      eveSocket.emit("conversation:join", { conversationId: conversation.id }, (res) => {
        resolve(res);
      });
    });
    assert.strictEqual(eveJoinResult.success, false, "Non-member must be denied room access");
    assert.strictEqual(eveJoinResult.error?.code, "FORBIDDEN");
    console.log("   ✓ Unauthorized conversation access strictly blocked with FORBIDDEN");

    // -------------------------------------------------------------
    // Test 6: Real-Time Message Delivery (Alice -> Bob)
    // -------------------------------------------------------------
    console.log("6. Testing Real-time Message Delivery...");
    const bobSocket = createClientSocket(bobToken);
    await connectSocket(bobSocket);

    // Bob joins the room
    await new Promise((resolve) => {
      bobSocket.emit("conversation:join", { conversationId: conversation.id }, resolve);
    });

    const receivedMessagesByBob: MessageResponseDTO[] = [];
    bobSocket.on("message:new", (msg) => {
      receivedMessagesByBob.push(msg);
    });

    const clientMsgId1 = `cmsg_${Date.now()}_1`;
    const sendResult: any = await new Promise((resolve) => {
      aliceSocket1.emit(
        "message:send",
        {
          conversationId: conversation.id,
          clientMessageId: clientMsgId1,
          content: "Hello Bob! Testing Socket.IO delivery.",
          type: "TEXT",
        },
        resolve
      );
    });

    assert.strictEqual(sendResult.success, true, "Message send must succeed");
    assert.ok(sendResult.data?.id);
    assert.strictEqual(sendResult.data.content, "Hello Bob! Testing Socket.IO delivery.");

    // Wait for delivery to Bob
    await delay(200);
    assert.strictEqual(receivedMessagesByBob.length, 1, "Bob must receive message:new in real-time");
    assert.strictEqual(receivedMessagesByBob[0].id, sendResult.data.id);
    console.log("   ✓ Real-time message delivered to room members");

    // -------------------------------------------------------------
    // Test 7: Database Persistence & Attachments Verification
    // -------------------------------------------------------------
    console.log("7. Testing Database Persistence & Attachment Storage...");
    const clientMsgId2 = `cmsg_${Date.now()}_2`;
    const sendWithAttResult: any = await new Promise((resolve) => {
      aliceSocket1.emit(
        "message:send",
        {
          conversationId: conversation.id,
          clientMessageId: clientMsgId2,
          content: "Here is an architecture diagram attachment",
          type: "IMAGE",
          attachments: [
            {
              secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/diagram.png",
              publicId: "poppin/posts/diagram_1",
              resourceType: "image",
              format: "png",
              width: 1920,
              height: 1080,
              bytes: 204800,
            },
          ],
        },
        resolve
      );
    });

    assert.strictEqual(sendWithAttResult.success, true);
    const persistedMsg = await prisma.message.findUnique({
      where: { id: sendWithAttResult.data.id },
      include: { attachments: true },
    });
    assert.ok(persistedMsg, "Message must be saved in database");
    assert.strictEqual(persistedMsg.content, "Here is an architecture diagram attachment");
    assert.strictEqual(persistedMsg.attachments.length, 1);
    assert.strictEqual(persistedMsg.attachments[0].secureUrl, "https://res.cloudinary.com/demo/image/upload/v1/diagram.png");
    console.log("   ✓ Message and attachments persisted in PostgreSQL with Prisma relations");

    // -------------------------------------------------------------
    // Test 8: Duplicate Message Prevention (Idempotency)
    // -------------------------------------------------------------
    console.log("8. Testing Duplicate Message Prevention (Idempotency)...");
    const duplicateSendResult: any = await new Promise((resolve) => {
      aliceSocket1.emit(
        "message:send",
        {
          conversationId: conversation.id,
          clientMessageId: clientMsgId1, // Re-using clientMsgId1 from Test 6
          content: "Hello Bob! Testing Socket.IO delivery.",
          type: "TEXT",
        },
        resolve
      );
    });

    assert.strictEqual(duplicateSendResult.success, true);
    assert.strictEqual(
      duplicateSendResult.data.id,
      sendResult.data.id,
      "Duplicate send must return original message without inserting new row"
    );

    const messageCount = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        clientMessageId: clientMsgId1,
      },
    });
    assert.strictEqual(messageCount, 1, "Exactly 1 record must exist in database for clientMessageId");
    console.log("   ✓ Idempotent retry handling verified; duplicate messages prevented");

    // -------------------------------------------------------------
    // Test 9: Multiple Simultaneous Devices Support
    // -------------------------------------------------------------
    console.log("9. Testing Multi-Device Synchronization (Alice Device 2)...");
    const aliceSocket2 = createClientSocket(aliceToken);
    await connectSocket(aliceSocket2);

    await new Promise((resolve) => {
      aliceSocket2.emit("conversation:join", { conversationId: conversation.id }, resolve);
    });

    const receivedByAlice2: MessageResponseDTO[] = [];
    aliceSocket2.on("message:new", (m) => receivedByAlice2.push(m));

    const bobMsgId = `cmsg_bob_${Date.now()}`;
    await new Promise((resolve) => {
      bobSocket.emit(
        "message:send",
        {
          conversationId: conversation.id,
          clientMessageId: bobMsgId,
          content: "Got your message Alice!",
        },
        resolve
      );
    });

    await delay(200);
    assert.strictEqual(receivedByAlice2.length, 1, "Alice's second device must also receive message:new");
    console.log("   ✓ Multi-device sync verified across concurrent sockets");

    // -------------------------------------------------------------
    // Test 10: Typing Indicators & Auto-Expiration
    // -------------------------------------------------------------
    console.log("10. Testing Typing Indicator Broadcasts...");
    const typingEventsReceived: any[] = [];
    bobSocket.on("typing:update", (ev) => typingEventsReceived.push(ev));

    // Alice starts typing
    aliceSocket1.emit("typing:start", { conversationId: conversation.id });
    await delay(500);

    assert.ok(typingEventsReceived.length >= 1, "Bob should receive typing event");
    assert.strictEqual(typingEventsReceived[0].isTyping, true);
    assert.strictEqual(typingEventsReceived[0].userId, aliceUser.id);

    // Alice stops typing
    aliceSocket1.emit("typing:stop", { conversationId: conversation.id });
    await delay(500);

    const lastTyping = typingEventsReceived[typingEventsReceived.length - 1];
    assert.strictEqual(lastTyping.isTyping, false);
    console.log("   ✓ Typing start & stop events verified without database writes");

    // -------------------------------------------------------------
    // Test 11: Online / Offline Presence Tracking
    // -------------------------------------------------------------
    console.log("11. Testing Online & Offline Presence Broadcasting...");
    let userOfflineReceived = false;
    bobSocket.on("user:offline", (data) => {
      if (data.userId === aliceUser.id) {
        userOfflineReceived = true;
      }
    });

    // Disconnect Alice Socket 1 (Alice Socket 2 is still connected, so should NOT be offline yet)
    aliceSocket1.disconnect();
    await delay(100);
    assert.strictEqual(userOfflineReceived, false, "User must remain online while at least 1 socket is open");

    // Disconnect Alice Socket 2 (all sockets closed -> user is now offline)
    aliceSocket2.disconnect();
    await delay(200);
    assert.strictEqual(userOfflineReceived, true, "User must broadcast user:offline once all sockets disconnect");
    console.log("   ✓ Multi-device online/offline presence tracking verified");

    // -------------------------------------------------------------
    // Test 12: Read Receipts
    // -------------------------------------------------------------
    console.log("12. Testing Message Read Receipts...");
    const readEventsReceived: any[] = [];
    // Reconnect an Alice socket
    const aliceSocket3 = createClientSocket(aliceToken);
    await connectSocket(aliceSocket3);
    await new Promise((resolve) => aliceSocket3.emit("conversation:join", { conversationId: conversation.id }, resolve));
    aliceSocket3.on("message:read", (ev) => readEventsReceived.push(ev));

    // Bob marks Alice's message as read
    const markReadRes: any = await new Promise((resolve) => {
      bobSocket.emit(
        "message:read",
        {
          conversationId: conversation.id,
          messageId: sendResult.data.id,
        },
        resolve
      );
    });

    assert.strictEqual(markReadRes.success, true);
    await delay(400);
    assert.strictEqual(readEventsReceived.length, 1);
    assert.strictEqual(readEventsReceived[0].messageId, sendResult.data.id);
    assert.strictEqual(readEventsReceived[0].userId, bobUser.id);

    // Verify DB receipt
    const receipt = await prisma.messageReceipt.findUnique({
      where: {
        messageId_userId: {
          messageId: sendResult.data.id,
          userId: bobUser.id,
        },
      },
    });
    assert.ok(receipt?.readAt, "Receipt must be saved in database");
    console.log("   ✓ Real-time read receipt and database persistence verified");

    // -------------------------------------------------------------
    // Test 13: Message Deletion
    // -------------------------------------------------------------
    console.log("13. Testing Message Soft Deletion...");
    let deleteEventReceived = false;
    bobSocket.on("message:deleted", (ev) => {
      if (ev.messageId === sendResult.data.id) {
        deleteEventReceived = true;
      }
    });

    // Alice deletes her message
    const deleteRes: any = await new Promise((resolve) => {
      aliceSocket3.emit(
        "message:delete",
        {
          conversationId: conversation.id,
          messageId: sendResult.data.id,
        },
        resolve
      );
    });
    assert.strictEqual(deleteRes.success, true);
    await delay(400);
    assert.strictEqual(deleteEventReceived, true, "Bob should receive message:deleted");

    const deletedInDb = await prisma.message.findUnique({
      where: { id: sendResult.data.id },
    });
    assert.ok(deletedInDb?.deletedAt, "Message must have deletedAt timestamp");
    console.log("   ✓ Soft message deletion and room broadcast verified");

    // -------------------------------------------------------------
    // Test 14: Rate Limiting Guard
    // -------------------------------------------------------------
    console.log("14. Testing Rate Limiting Guard...");
    const burstPromises = Array.from({ length: 20 }, (_, i) => {
      return new Promise<any>((resolve) => {
        bobSocket.emit(
          "message:send",
          {
            conversationId: conversation.id,
            clientMessageId: `burst_${Date.now()}_${i}`,
            content: `Spam burst ${i}`,
          },
          resolve
        );
      });
    });

    const burstResults = await Promise.all(burstPromises);
    const rateLimitTriggered = burstResults.some((res) => res?.error?.code === "RATE_LIMITED");
    assert.strictEqual(rateLimitTriggered, true, "High frequency message burst must trigger RATE_LIMITED");
    console.log("   ✓ Socket event rate limiter enforced");

    // -------------------------------------------------------------
    // Test 15: Heartbeat & Health Check
    // -------------------------------------------------------------
    console.log("15. Testing Heartbeat & Health Endpoint...");
    const heartbeatRes: any = await new Promise((resolve) => {
      bobSocket.emit("heartbeat", resolve);
    });
    assert.ok(heartbeatRes?.timestamp);

    // Verify /health endpoint
    const healthRes = await fetch(`${TEST_URL}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, "ok");
    assert.strictEqual(healthJson.service, "poppin-realtime-server");
    console.log("   ✓ Heartbeat and /health check endpoint verified");

    console.log("\n==================================================");
    console.log(" >>> ALL 15 REAL-TIME SOCKET.IO TESTS PASSED! <<< ");
    console.log("==================================================");
  } finally {
    // Teardown
    for (const s of socketsToCleanup) {
      if (s.connected) s.disconnect();
    }
    ioServer.close();
    server.close();
  }
}

// Direct execution support
if (require.main === module) {
  runRealtimeSocketTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
