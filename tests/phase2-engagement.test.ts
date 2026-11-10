// POPPIN Phase 2: Engagement Verification Suite
// Verifies Like/Unlike, Comments, Strict 1-Level Replies, Save/Unsave, Ownership, and Saved-Post Pagination

import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { POST as createPostHandler } from "../app/api/v1/posts/route";
import {
  POST as likePostHandler,
  DELETE as unlikePostHandler,
} from "../app/api/v1/posts/[postId]/like/route";
import {
  GET as getCommentsHandler,
  POST as addCommentHandler,
} from "../app/api/v1/posts/[postId]/comments/route";
import {
  PATCH as patchCommentHandler,
  DELETE as deleteCommentHandler,
} from "../app/api/v1/comments/[commentId]/route";
import {
  POST as savePostHandler,
  DELETE as unsavePostHandler,
} from "../app/api/v1/posts/[postId]/save/route";
import { GET as getSavedPostsHandler } from "../app/api/v1/users/me/saved-posts/route";

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

export async function runPhase2EngagementTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 2: ENGAGEMENT TESTS              ");
  console.log("==================================================");

  const testEmails = [
    "phase2_author@poppin.io",
    "phase2_engager@poppin.io",
    "phase2_third@poppin.io",
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
  await prisma.profile.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  // Setup test users
  const authorUser = await prisma.user.create({
    data: {
      email: "phase2_author@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "phase2_author",
          displayName: "Phase 2 Author",
        },
      },
    },
  });
  const authorToken = signToken({ userId: authorUser.id, email: authorUser.email, tokenVersion: 1 });

  const engagerUser = await prisma.user.create({
    data: {
      email: "phase2_engager@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "phase2_engager",
          displayName: "Phase 2 Engager",
        },
      },
    },
  });
  const engagerToken = signToken({ userId: engagerUser.id, email: engagerUser.email, tokenVersion: 1 });

  const thirdUser = await prisma.user.create({
    data: {
      email: "phase2_third@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "phase2_third",
          displayName: "Phase 2 Third",
        },
      },
    },
  });
  const thirdToken = signToken({ userId: thirdUser.id, email: thirdUser.email, tokenVersion: 1 });

  // Create initial test post
  const createPostReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Engagement test post content #engagement",
    type: "UPDATE",
  }, { token: authorToken });
  const createPostRes = await createPostHandler(createPostReq);
  const createPostJson = await createPostRes.json();
  const postId = createPostJson.data.id;

  // 1. Like & Idempotent Like
  console.log("1. Testing Like & Duplicate Idempotent Like Prevention...");
  const likeReq = createJsonRequest(`/api/v1/posts/${postId}/like`, "POST", undefined, { token: engagerToken });
  const likeRes = await likePostHandler(likeReq, { params: Promise.resolve({ postId }) });
  const likeJson = await likeRes.json();
  assert.strictEqual(likeRes.status, 200);
  assert.strictEqual(likeJson.data.liked, true);
  assert.strictEqual(likeJson.data.likesCount, 1);

  // Repeat like (idempotent)
  const dupLikeRes = await likePostHandler(likeReq, { params: Promise.resolve({ postId }) });
  const dupLikeJson = await dupLikeRes.json();
  assert.strictEqual(dupLikeRes.status, 200);
  assert.strictEqual(dupLikeJson.data.liked, true);
  assert.strictEqual(dupLikeJson.data.likesCount, 1);

  // 2. Unlike & Idempotent Unlike
  console.log("2. Testing Unlike & Duplicate Idempotent Unlike...");
  const unlikeReq = createJsonRequest(`/api/v1/posts/${postId}/like`, "DELETE", undefined, { token: engagerToken });
  const unlikeRes = await unlikePostHandler(unlikeReq, { params: Promise.resolve({ postId }) });
  const unlikeJson = await unlikeRes.json();
  assert.strictEqual(unlikeRes.status, 200);
  assert.strictEqual(unlikeJson.data.liked, false);
  assert.strictEqual(unlikeJson.data.likesCount, 0);

  // Repeat unlike
  const dupUnlikeRes = await unlikePostHandler(unlikeReq, { params: Promise.resolve({ postId }) });
  const dupUnlikeJson = await dupUnlikeRes.json();
  assert.strictEqual(dupUnlikeRes.status, 200);
  assert.strictEqual(dupUnlikeJson.data.liked, false);
  assert.strictEqual(dupUnlikeJson.data.likesCount, 0);

  // 3. Top-Level Comment Creation
  console.log("3. Testing Top-Level Comment Creation...");
  const commentReq = createJsonRequest(`/api/v1/posts/${postId}/comments`, "POST", {
    content: "This is a great update!",
  }, { token: engagerToken });
  const commentRes = await addCommentHandler(commentReq, { params: Promise.resolve({ postId }) });
  const commentJson = await commentRes.json();
  assert.strictEqual(commentRes.status, 201);
  assert.strictEqual(commentJson.data.content, "This is a great update!");
  assert.strictEqual(commentJson.data.author.username, "phase2_engager");
  const topCommentId = commentJson.data.id;

  // 4. One-Level Reply Creation & Retrieval
  console.log("4. Testing 1-Level Reply Creation & Nested Tree Retrieval...");
  const replyReq = createJsonRequest(`/api/v1/posts/${postId}/comments`, "POST", {
    content: "Thanks for the feedback!",
    replyToCommentId: topCommentId,
  }, { token: authorToken });
  const replyRes = await addCommentHandler(replyReq, { params: Promise.resolve({ postId }) });
  const replyJson = await replyRes.json();
  assert.strictEqual(replyRes.status, 201);
  assert.strictEqual(replyJson.data.replyToCommentId, topCommentId);
  const replyId = replyJson.data.id;

  // Retrieve comments list
  const getCommentsReq = createJsonRequest(`/api/v1/posts/${postId}/comments`, "GET", undefined, { token: authorToken });
  const getCommentsRes = await getCommentsHandler(getCommentsReq, { params: Promise.resolve({ postId }) });
  const getCommentsJson = await getCommentsRes.json();
  assert.strictEqual(getCommentsRes.status, 200);
  assert.strictEqual(getCommentsJson.data.length, 1); // Only 1 top-level comment
  assert.strictEqual(getCommentsJson.data[0].id, topCommentId);
  assert.strictEqual(getCommentsJson.data[0].replies.length, 1); // Contains 1 nested reply
  assert.strictEqual(getCommentsJson.data[0].replies[0].id, replyId);

  // 5. Strict 1-Level Reply Guard (Rejecting depth > 1)
  console.log("5. Testing Strict 1-Level Nesting Guard (Rejecting replies to replies)...");
  const nestedReplyReq = createJsonRequest(`/api/v1/posts/${postId}/comments`, "POST", {
    content: "Trying to reply to a reply (nested depth 2)",
    replyToCommentId: replyId, // replyId already has parent topCommentId
  }, { token: thirdToken });
  const nestedReplyRes = await addCommentHandler(nestedReplyReq, { params: Promise.resolve({ postId }) });
  assert.strictEqual(nestedReplyRes.status, 400);
  const nestedReplyJson = await nestedReplyRes.json();
  assert.strictEqual(nestedReplyJson.error.code, "NESTED_REPLIES_NOT_ALLOWED");

  // 6. Comment Edit & Ownership
  console.log("6. Testing Comment Edit & Ownership Protection...");
  // Unauthorized edit attempt
  const unauthEditReq = createJsonRequest(`/api/v1/comments/${topCommentId}`, "PATCH", {
    content: "Hacked comment content",
  }, { token: thirdToken });
  const unauthEditRes = await patchCommentHandler(unauthEditReq, { params: Promise.resolve({ commentId: topCommentId }) });
  assert.strictEqual(unauthEditRes.status, 403);

  // Authorized edit by comment author
  const authEditReq = createJsonRequest(`/api/v1/comments/${topCommentId}`, "PATCH", {
    content: "This is an edited comment!",
  }, { token: engagerToken });
  const authEditRes = await patchCommentHandler(authEditReq, { params: Promise.resolve({ commentId: topCommentId }) });
  const authEditJson = await authEditRes.json();
  assert.strictEqual(authEditRes.status, 200);
  assert.strictEqual(authEditJson.data.content, "This is an edited comment!");

  // 7. Comment Delete & Cascade Deletion of Replies
  console.log("7. Testing Comment Delete & Cascade Removal of Replies...");
  // Unauthorized delete
  const unauthDeleteReq = createJsonRequest(`/api/v1/comments/${topCommentId}`, "DELETE", undefined, { token: thirdToken });
  const unauthDeleteRes = await deleteCommentHandler(unauthDeleteReq, { params: Promise.resolve({ commentId: topCommentId }) });
  assert.strictEqual(unauthDeleteRes.status, 403);

  // Authorized delete
  const authDeleteReq = createJsonRequest(`/api/v1/comments/${topCommentId}`, "DELETE", undefined, { token: engagerToken });
  const authDeleteRes = await deleteCommentHandler(authDeleteReq, { params: Promise.resolve({ commentId: topCommentId }) });
  assert.strictEqual(authDeleteRes.status, 200);

  // Verify both top-level and reply are gone from database
  const commentsAfterDelete = await prisma.comment.findMany({ where: { postId } });
  assert.strictEqual(commentsAfterDelete.length, 0);

  // 8. Save & Unsave Post
  console.log("8. Testing Save & Unsave Post...");
  const saveReq = createJsonRequest(`/api/v1/posts/${postId}/save`, "POST", undefined, { token: engagerToken });
  const saveRes = await savePostHandler(saveReq, { params: Promise.resolve({ postId }) });
  const saveJson = await saveRes.json();
  assert.strictEqual(saveRes.status, 200);
  assert.strictEqual(saveJson.data.saved, true);

  // Verify post appears in saved posts
  const getSavedReq = createJsonRequest("/api/v1/users/me/saved-posts", "GET", undefined, { token: engagerToken });
  const getSavedRes = await getSavedPostsHandler(getSavedReq);
  const getSavedJson = await getSavedRes.json();
  assert.strictEqual(getSavedRes.status, 200);
  assert.strictEqual(getSavedJson.data.items.length, 1);
  assert.strictEqual(getSavedJson.data.items[0].id, postId);

  // Unsave post
  const unsaveReq = createJsonRequest(`/api/v1/posts/${postId}/save`, "DELETE", undefined, { token: engagerToken });
  const unsaveRes = await unsavePostHandler(unsaveReq, { params: Promise.resolve({ postId }) });
  const unsaveJson = await unsaveRes.json();
  assert.strictEqual(unsaveRes.status, 200);
  assert.strictEqual(unsaveJson.data.saved, false);

  // Verify post no longer in saved list
  const getSavedAfterUnsaveRes = await getSavedPostsHandler(getSavedReq);
  const getSavedAfterUnsaveJson = await getSavedAfterUnsaveRes.json();
  assert.strictEqual(getSavedAfterUnsaveJson.data.items.length, 0);

  // 9. Saved Posts Cursor Pagination
  console.log("9. Testing Saved Posts Cursor Pagination...");
  // Create 3 posts and save them
  const postIds: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const pReq = createJsonRequest("/api/v1/posts", "POST", {
      content: `Pagination Post ${i}`,
      type: "UPDATE",
    }, { token: authorToken });
    const pRes = await createPostHandler(pReq);
    const pJson = await pRes.json();
    postIds.push(pJson.data.id);
    await savePostHandler(
      createJsonRequest(`/api/v1/posts/${pJson.data.id}/save`, "POST", undefined, { token: engagerToken }),
      { params: Promise.resolve({ postId: pJson.data.id }) }
    );
  }

  // Request page 1 with limit=2
  const page1Req = createJsonRequest("/api/v1/users/me/saved-posts?limit=2", "GET", undefined, { token: engagerToken });
  const page1Res = await getSavedPostsHandler(page1Req);
  const page1Json = await page1Res.json();
  assert.strictEqual(page1Json.data.items.length, 2);
  assert.strictEqual(page1Json.data.hasMore, true);
  assert.ok(page1Json.data.nextCursor);

  // Request page 2 with cursor
  const page2Req = createJsonRequest(
    `/api/v1/users/me/saved-posts?limit=2&cursor=${page1Json.data.nextCursor}`,
    "GET",
    undefined,
    { token: engagerToken }
  );
  const page2Res = await getSavedPostsHandler(page2Req);
  const page2Json = await page2Res.json();
  assert.strictEqual(page2Json.data.items.length, 1);
  assert.strictEqual(page2Json.data.hasMore, false);

  // Cleanup test data
  await prisma.comment.deleteMany({ where: { author: { email: { in: testEmails } } } });
  await prisma.like.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.savedPost.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.post.deleteMany({ where: { author: { email: { in: testEmails } } } });
  await prisma.profile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  console.log("\n>>> ALL PHASE 2 ENGAGEMENT TESTS PASSED SUCCESSFULLY! <<<");
}

