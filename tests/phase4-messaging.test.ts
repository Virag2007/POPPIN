// POPPIN Phase 4: Messaging & Groups Verification Suite
// Verifies 1-on-1 Chat, Block Enforcement, Membership Protection, Group Roles & Admin Permissions, Unread Counts, and Real-time Events

import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { socketClient } from "../lib/socket-client";
import {
  GET as getConversationsHandler,
  POST as createConversationHandler,
} from "../app/api/v1/conversations/route";
import {
  GET as getMessagesHandler,
  POST as sendMessageHandler,
} from "../app/api/v1/conversations/[conversationId]/messages/route";
import { GET as getUnreadCountHandler } from "../app/api/v1/conversations/[conversationId]/unread-count/route";
import { POST as markReadHandler } from "../app/api/v1/conversations/[conversationId]/read/route";
import { POST as createGroupHandler } from "../app/api/v1/groups/route";
import {
  GET as getGroupHandler,
  PATCH as updateGroupHandler,
} from "../app/api/v1/groups/[groupId]/route";
import { POST as addGroupMemberHandler } from "../app/api/v1/groups/[groupId]/members/route";
import { DELETE as removeGroupMemberHandler } from "../app/api/v1/groups/[groupId]/members/[userId]/route";

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

export async function runPhase4MessagingTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 4: MESSAGING & GROUPS TESTS      ");
  console.log("==================================================");

  const testEmails = [
    "msg_alice@poppin.io",
    "msg_bob@poppin.io",
    "msg_charlie@poppin.io",
    "msg_dave@poppin.io",
  ];

  // Clean test database before running
  await prisma.message.deleteMany({
    where: { sender: { email: { in: testEmails } } },
  });
  await prisma.conversationMember.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.conversation.deleteMany({
    where: {
      members: { some: { user: { email: { in: testEmails } } } },
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
  await prisma.profile.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  // Setup test users
  const alice = await prisma.user.create({
    data: {
      email: "msg_alice@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "msg_alice", displayName: "Alice" } },
    },
  });
  const aliceToken = signToken({ userId: alice.id, email: alice.email, tokenVersion: 1 });

  const bob = await prisma.user.create({
    data: {
      email: "msg_bob@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "msg_bob", displayName: "Bob" } },
    },
  });
  const bobToken = signToken({ userId: bob.id, email: bob.email, tokenVersion: 1 });

  const charlie = await prisma.user.create({
    data: {
      email: "msg_charlie@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "msg_charlie", displayName: "Charlie" } },
    },
  });
  const charlieToken = signToken({ userId: charlie.id, email: charlie.email, tokenVersion: 1 });

  const dave = await prisma.user.create({
    data: {
      email: "msg_dave@poppin.io",
      tokenVersion: 1,
      profile: { create: { username: "msg_dave", displayName: "Dave" } },
    },
  });
  const daveToken = signToken({ userId: dave.id, email: dave.email, tokenVersion: 1 });

  // Setup block relationship (Alice blocks Dave)
  await prisma.block.create({
    data: { blockerId: alice.id, blockedId: dave.id },
  });

  // 1. One-on-One Conversation Creation & Idempotency
  console.log("1. Testing 1-on-1 Conversation Creation & Idempotency...");
  const createDirectReq = createJsonRequest("/api/v1/conversations", "POST", {
    recipientId: bob.id,
  }, { token: aliceToken });
  const createDirectRes = await createConversationHandler(createDirectReq);
  const createDirectJson = await createDirectRes.json();
  assert.strictEqual(createDirectRes.status, 201);
  assert.strictEqual(createDirectJson.data.isGroup, false);
  const conversationId = createDirectJson.data.id;

  // Repeat create direct conversation (should return the same conversation ID)
  const dupDirectReq = createJsonRequest("/api/v1/conversations", "POST", {
    recipientId: bob.id,
  }, { token: aliceToken });
  const dupDirectRes = await createConversationHandler(dupDirectReq);
  const dupDirectJson = await dupDirectRes.json();
  assert.strictEqual(dupDirectRes.status, 201);
  assert.strictEqual(dupDirectJson.data.id, conversationId);

  // 2. Direct Messaging Block Enforcement
  console.log("2. Testing Direct Messaging Block Enforcement (Developer 1 Contract)...");
  // Alice tries to chat with blocked Dave
  const blockedChatReq = createJsonRequest("/api/v1/conversations", "POST", {
    recipientId: dave.id,
  }, { token: aliceToken });
  const blockedChatRes = await createConversationHandler(blockedChatReq);
  assert.strictEqual(blockedChatRes.status, 403);

  // 3. Message Sending & Realtime Delivery
  console.log("3. Testing Message Sending & Realtime Socket Event Dispatching...");
  let receivedRealtimeMessage: any = null;
  const unsubscribeSocket = socketClient.on("message:new", (msg) => {
    receivedRealtimeMessage = msg;
  });

  const sendMsgReq = createJsonRequest(`/api/v1/conversations/${conversationId}/messages`, "POST", {
    content: "Hello Bob! Welcome to POPPIN messaging.",
  }, { token: aliceToken });
  const sendMsgRes = await sendMessageHandler(sendMsgReq, { params: Promise.resolve({ conversationId }) });
  const sendMsgJson = await sendMsgRes.json();
  assert.strictEqual(sendMsgRes.status, 201);
  assert.strictEqual(sendMsgJson.data.content, "Hello Bob! Welcome to POPPIN messaging.");
  assert.strictEqual(sendMsgJson.data.senderId, alice.id);

  // Verify real-time socket event was emitted
  assert.ok(receivedRealtimeMessage);
  assert.strictEqual(receivedRealtimeMessage.content, "Hello Bob! Welcome to POPPIN messaging.");
  unsubscribeSocket();

  // 4. Message History Retrieval & Unread Counts
  console.log("4. Testing Message History Retrieval & Unread Counts...");
  // Bob queries unread count
  const unreadReq = createJsonRequest(`/api/v1/conversations/${conversationId}/unread-count`, "GET", undefined, { token: bobToken });
  const unreadRes = await getUnreadCountHandler(unreadReq, { params: Promise.resolve({ conversationId }) });
  const unreadJson = await unreadRes.json();
  assert.strictEqual(unreadRes.status, 200);
  assert.strictEqual(unreadJson.data.unreadCount, 1);

  // Bob marks conversation as read
  const markReadReq = createJsonRequest(`/api/v1/conversations/${conversationId}/read`, "POST", undefined, { token: bobToken });
  const markReadRes = await markReadHandler(markReadReq, { params: Promise.resolve({ conversationId }) });
  assert.strictEqual(markReadRes.status, 200);

  // Bob queries unread count again -> must be 0
  const unreadAfterRes = await getUnreadCountHandler(unreadReq, { params: Promise.resolve({ conversationId }) });
  const unreadAfterJson = await unreadAfterRes.json();
  assert.strictEqual(unreadAfterJson.data.unreadCount, 0);

  // 5. Message Cursor Pagination
  console.log("5. Testing Message Cursor Pagination...");
  // Alice sends 3 more messages
  for (let i = 1; i <= 3; i++) {
    await sendMessageHandler(
      createJsonRequest(`/api/v1/conversations/${conversationId}/messages`, "POST", {
        content: `Numbered Message ${i}`,
      }, { token: aliceToken }),
      { params: Promise.resolve({ conversationId }) }
    );
  }

  const p1Req = createJsonRequest(`/api/v1/conversations/${conversationId}/messages?limit=2`, "GET", undefined, { token: bobToken });
  const p1Res = await getMessagesHandler(p1Req, { params: Promise.resolve({ conversationId }) });
  const p1Json = await p1Res.json();
  assert.strictEqual(p1Json.data.items.length, 2);
  assert.strictEqual(p1Json.data.hasMore, true);
  assert.ok(p1Json.data.nextCursor);

  const p2Req = createJsonRequest(
    `/api/v1/conversations/${conversationId}/messages?limit=2&cursor=${p1Json.data.nextCursor}`,
    "GET",
    undefined,
    { token: bobToken }
  );
  const p2Res = await getMessagesHandler(p2Req, { params: Promise.resolve({ conversationId }) });
  const p2Json = await p2Res.json();
  assert.strictEqual(p2Json.data.items.length, 2);

  // 6. Conversation Membership Protection (Non-members rejected with 403)
  console.log("6. Testing Membership Protection (Non-members cannot read or send messages)...");
  const unauthGetReq = createJsonRequest(`/api/v1/conversations/${conversationId}/messages`, "GET", undefined, { token: charlieToken });
  const unauthGetRes = await getMessagesHandler(unauthGetReq, { params: Promise.resolve({ conversationId }) });
  assert.strictEqual(unauthGetRes.status, 403);

  const unauthSendReq = createJsonRequest(`/api/v1/conversations/${conversationId}/messages`, "POST", {
    content: "Intruder message",
  }, { token: charlieToken });
  const unauthSendRes = await sendMessageHandler(unauthSendReq, { params: Promise.resolve({ conversationId }) });
  assert.strictEqual(unauthSendRes.status, 403);

  // 7. Group Creation & Admin Permissions Enforcement
  console.log("7. Testing Group Creation & Admin Roles...");
  const createGroupReq = createJsonRequest("/api/v1/groups", "POST", {
    name: "Engineering Core Team",
    memberIds: [bob.id],
  }, { token: aliceToken });
  const createGroupRes = await createGroupHandler(createGroupReq);
  const createGroupJson = await createGroupRes.json();
  assert.strictEqual(createGroupRes.status, 201);
  assert.strictEqual(createGroupJson.data.isGroup, true);
  assert.strictEqual(createGroupJson.data.name, "Engineering Core Team");
  const groupId = createGroupJson.data.id;

  // Verify creator Alice is ADMIN, Bob is MEMBER
  const aliceMember = createGroupJson.data.members.find((m: any) => m.userId === alice.id);
  const bobMember = createGroupJson.data.members.find((m: any) => m.userId === bob.id);
  assert.strictEqual(aliceMember.role, "ADMIN");
  assert.strictEqual(bobMember.role, "MEMBER");

  // Non-admin Bob attempts to update group settings -> 403
  const bobUpdateGroupReq = createJsonRequest(`/api/v1/groups/${groupId}`, "PATCH", {
    name: "Hacked Group Name",
  }, { token: bobToken });
  const bobUpdateRes = await updateGroupHandler(bobUpdateGroupReq, { params: Promise.resolve({ groupId }) });
  assert.strictEqual(bobUpdateRes.status, 403);

  // Admin Alice updates group name -> 200
  const aliceUpdateGroupReq = createJsonRequest(`/api/v1/groups/${groupId}`, "PATCH", {
    name: "POPPIN Founders & Leads",
  }, { token: aliceToken });
  const aliceUpdateRes = await updateGroupHandler(aliceUpdateGroupReq, { params: Promise.resolve({ groupId }) });
  const aliceUpdateJson = await aliceUpdateRes.json();
  assert.strictEqual(aliceUpdateRes.status, 200);
  assert.strictEqual(aliceUpdateJson.data.name, "POPPIN Founders & Leads");

  // Non-admin Bob attempts to add member -> 403
  const bobAddMemberReq = createJsonRequest(`/api/v1/groups/${groupId}/members`, "POST", {
    userId: charlie.id,
  }, { token: bobToken });
  const bobAddMemberRes = await addGroupMemberHandler(bobAddMemberReq, { params: Promise.resolve({ groupId }) });
  assert.strictEqual(bobAddMemberRes.status, 403);

  // Admin Alice adds member Charlie -> 200
  const aliceAddMemberReq = createJsonRequest(`/api/v1/groups/${groupId}/members`, "POST", {
    userId: charlie.id,
  }, { token: aliceToken });
  const aliceAddMemberRes = await addGroupMemberHandler(aliceAddMemberReq, { params: Promise.resolve({ groupId }) });
  assert.strictEqual(aliceAddMemberRes.status, 200);

  // Verify Charlie is now in group
  const getGroupReq = createJsonRequest(`/api/v1/groups/${groupId}`, "GET", undefined, { token: charlieToken });
  const getGroupRes = await getGroupHandler(getGroupReq, { params: Promise.resolve({ groupId }) });
  const getGroupJson = await getGroupRes.json();
  assert.strictEqual(getGroupJson.data.members.length, 3);

  // Non-admin Bob attempts to remove Charlie -> 403
  const bobRemoveMemberReq = createJsonRequest(
    `/api/v1/groups/${groupId}/members/${charlie.id}`,
    "DELETE",
    undefined,
    { token: bobToken }
  );
  const bobRemoveMemberRes = await removeGroupMemberHandler(bobRemoveMemberReq, {
    params: Promise.resolve({ groupId, userId: charlie.id }),
  });
  assert.strictEqual(bobRemoveMemberRes.status, 403);

  // Admin Alice removes Charlie -> 200
  const aliceRemoveMemberReq = createJsonRequest(
    `/api/v1/groups/${groupId}/members/${charlie.id}`,
    "DELETE",
    undefined,
    { token: aliceToken }
  );
  const aliceRemoveMemberRes = await removeGroupMemberHandler(aliceRemoveMemberReq, {
    params: Promise.resolve({ groupId, userId: charlie.id }),
  });
  assert.strictEqual(aliceRemoveMemberRes.status, 200);

  // 8. User Conversation Listing
  console.log("8. Testing User Conversation Listing (GET /api/v1/conversations)...");
  const convListReq = createJsonRequest("/api/v1/conversations", "GET", undefined, { token: aliceToken });
  const convListRes = await getConversationsHandler(convListReq);
  const convListJson = await convListRes.json();
  assert.strictEqual(convListRes.status, 200);
  assert.strictEqual(convListJson.data.length, 2); // 1-on-1 chat and group chat

  // Cleanup test data
  await prisma.message.deleteMany({ where: { sender: { email: { in: testEmails } } } });
  await prisma.conversationMember.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.conversation.deleteMany({ where: { members: { some: { user: { email: { in: testEmails } } } } } });
  await prisma.block.deleteMany({ where: { OR: [{ blocker: { email: { in: testEmails } } }, { blocked: { email: { in: testEmails } } }] } });
  await prisma.profile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  console.log("\n>>> ALL PHASE 4 MESSAGING & GROUPS TESTS PASSED SUCCESSFULLY! <<<");
}
