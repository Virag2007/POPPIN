// POPPIN Phase 1: Posts & Media Verification Suite
// Verifies Post CRUD, 4 Post Types, Media Ordering, Links/Tags, Privacy/Blocking, and Ownership

import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { POST as createPostHandler } from "../app/api/v1/posts/route";
import {
  GET as getPostHandler,
  PATCH as patchPostHandler,
  DELETE as deletePostHandler,
} from "../app/api/v1/posts/[postId]/route";
import { POST as uploadMediaHandler } from "../app/api/v1/media/upload/route";

function createJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  options?: { token?: string; rawBody?: string }
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let requestBody: string | undefined = undefined;
  if (options?.rawBody !== undefined) {
    requestBody = options.rawBody;
  } else if (body !== undefined) {
    requestBody = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: requestBody,
  });
}

export async function runPhase1PostsTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 1: POSTS & MEDIA TESTS           ");
  console.log("==================================================");

  const testEmails = [
    "phase1_author@poppin.io",
    "phase1_second@poppin.io",
    "phase1_private@poppin.io",
  ];
  await prisma.post.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.profile.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.privacySettings.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.block.deleteMany({
    where: {
      OR: [
        { blocker: { email: { in: testEmails } } },
        { blocked: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  // Setup test users
  const authorUser = await prisma.user.create({
    data: {
      email: "phase1_author@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "phase1_author",
          displayName: "Phase 1 Author",
          headline: "Building POPPIN Full Stack",
        },
      },
    },
  });
  const authorToken = signToken({ userId: authorUser.id, email: authorUser.email, tokenVersion: 1 });

  const secondUser = await prisma.user.create({
    data: {
      email: "phase1_second@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "phase1_second",
          displayName: "Second User",
        },
      },
    },
  });
  const secondToken = signToken({ userId: secondUser.id, email: secondUser.email, tokenVersion: 1 });

  const privateUser = await prisma.user.create({
    data: {
      email: "phase1_private@poppin.io",
      tokenVersion: 1,
      profile: {
        create: {
          username: "phase1_private",
          displayName: "Private User",
        },
      },
      privacySettings: {
        create: {
          isPrivate: true,
        },
      },
    },
  });
  const privateToken = signToken({ userId: privateUser.id, email: privateUser.email, tokenVersion: 1 });

  // 1. Post Creation: All 4 Post Types
  console.log("1. Testing Post Creation across all 4 types (UPDATE, PROJECT_SHOWCASE, ACHIEVEMENT, LOOKING_FOR)...");
  const postTypes = ["UPDATE", "PROJECT_SHOWCASE", "ACHIEVEMENT", "LOOKING_FOR"] as const;

  for (const pType of postTypes) {
    const req = createJsonRequest("/api/v1/posts", "POST", {
      content: `Testing post creation for ${pType}`,
      type: pType,
      tags: ["dev", "poppin", pType.toLowerCase()],
    }, { token: authorToken });

    const res = await createPostHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.type, pType);
    assert.strictEqual(json.data.author.username, "phase1_author");
  }

  // 2. Multiple Images with Storage Metadata & Display Order Preservation
  console.log("2. Testing Multiple Images with Storage Metadata & Display Order...");
  const multiImageReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Project showcase with multiple screenshots and architectural diagrams #launch",
    type: "PROJECT_SHOWCASE",
    links: [
      { title: "Demo App", url: "https://poppin-demo.io" },
      { title: "GitHub Repo", url: "https://github.com/poppin/app" },
    ],
    tags: ["#Showcase", "TypeScript", "#Poppin_Community"],
    media: [
      {
        url: "https://storage.poppin.io/img1.png",
        key: "key_img_1",
        mimeType: "image/png",
        size: 51200,
        order: 0,
      },
      {
        url: "https://storage.poppin.io/img2.jpg",
        key: "key_img_2",
        mimeType: "image/jpeg",
        size: 102400,
        order: 1,
      },
      {
        url: "https://storage.poppin.io/img3.webp",
        key: "key_img_3",
        mimeType: "image/webp",
        size: 25600,
        order: 2,
      },
    ],
  }, { token: authorToken });

  const multiImageRes = await createPostHandler(multiImageReq);
  const multiImageJson = await multiImageRes.json();
  assert.strictEqual(multiImageRes.status, 201);
  assert.strictEqual(multiImageJson.data.media.length, 3);
  assert.strictEqual(multiImageJson.data.media[0].order, 0);
  assert.strictEqual(multiImageJson.data.media[1].order, 1);
  assert.strictEqual(multiImageJson.data.media[2].order, 2);
  assert.strictEqual(multiImageJson.data.links.length, 2);
  // Check tag normalization (lowercase, stripped hashtags)
  assert.deepStrictEqual(multiImageJson.data.tags, ["showcase", "typescript", "poppin_community"]);

  const createdPostId = multiImageJson.data.id;

  // 3. Retrieve Post by ID
  console.log("3. Testing GET /api/v1/posts/:postId...");
  const getReq = createJsonRequest(`/api/v1/posts/${createdPostId}`, "GET", undefined, { token: authorToken });
  const getRes = await getPostHandler(getReq, { params: Promise.resolve({ postId: createdPostId }) });
  const getJson = await getRes.json();
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getJson.data.id, createdPostId);
  assert.strictEqual(getJson.data.author.displayName, "Phase 1 Author");
  assert.strictEqual(getJson.data.likesCount, 0);
  assert.strictEqual(getJson.data.commentsCount, 0);

  // 4. Update Owned Post
  console.log("4. Testing PATCH /api/v1/posts/:postId as Owner...");
  const patchReq = createJsonRequest(`/api/v1/posts/${createdPostId}`, "PATCH", {
    content: "Updated showcase content with new features #updated",
    type: "ACHIEVEMENT",
    tags: ["updated", "achievement"],
  }, { token: authorToken });

  const patchRes = await patchPostHandler(patchReq, { params: Promise.resolve({ postId: createdPostId }) });
  const patchJson = await patchRes.json();
  assert.strictEqual(patchRes.status, 200);
  assert.strictEqual(patchJson.data.content, "Updated showcase content with new features #updated");
  assert.strictEqual(patchJson.data.type, "ACHIEVEMENT");
  assert.deepStrictEqual(patchJson.data.tags, ["updated", "achievement"]);

  // 5. Ownership Enforcement on Edit & Delete
  console.log("5. Testing Ownership Enforcement (Non-Owner Cannot Edit or Delete)...");
  const unauthorizedPatchReq = createJsonRequest(`/api/v1/posts/${createdPostId}`, "PATCH", {
    content: "Malicious modification attempt",
  }, { token: secondToken });

  const unauthPatchRes = await patchPostHandler(unauthorizedPatchReq, { params: Promise.resolve({ postId: createdPostId }) });
  assert.strictEqual(unauthPatchRes.status, 403);

  const unauthorizedDeleteReq = createJsonRequest(`/api/v1/posts/${createdPostId}`, "DELETE", undefined, { token: secondToken });
  const unauthDeleteRes = await deletePostHandler(unauthorizedDeleteReq, { params: Promise.resolve({ postId: createdPostId }) });
  assert.strictEqual(unauthDeleteRes.status, 403);

  // 6. Privacy & Blocking Enforcement
  console.log("6. Testing Privacy & Blocking Visibility Enforcement...");
  // Create post on private account
  const privatePostReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Private profile secret announcement",
    type: "UPDATE",
  }, { token: privateToken });
  const privatePostRes = await createPostHandler(privatePostReq);
  const privatePostJson = await privatePostRes.json();
  const privatePostId = privatePostJson.data.id;

  // Anonymous view should be 401 (Authentication required) or 403
  const anonViewReq = createJsonRequest(`/api/v1/posts/${privatePostId}`, "GET");
  const anonViewRes = await getPostHandler(anonViewReq, { params: Promise.resolve({ postId: privatePostId }) });
  assert.ok(anonViewRes.status === 401 || anonViewRes.status === 403);

  // Non-follower view should be 403
  const nonFollowerViewReq = createJsonRequest(`/api/v1/posts/${privatePostId}`, "GET", undefined, { token: secondToken });
  const nonFollowerViewRes = await getPostHandler(nonFollowerViewReq, { params: Promise.resolve({ postId: privatePostId }) });
  assert.strictEqual(nonFollowerViewRes.status, 403);

  // Test Blocking
  await prisma.block.create({
    data: {
      blockerId: authorUser.id,
      blockedId: secondUser.id,
    },
  });

  const blockedViewReq = createJsonRequest(`/api/v1/posts/${createdPostId}`, "GET", undefined, { token: secondToken });
  const blockedViewRes = await getPostHandler(blockedViewReq, { params: Promise.resolve({ postId: createdPostId }) });
  assert.strictEqual(blockedViewRes.status, 403);

  // 7. Media Upload API
  console.log("7. Testing Media Upload API (POST /api/v1/media/upload)...");
  const validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const uploadReq = createJsonRequest("/api/v1/media/upload", "POST", {
    fileName: "profile_banner.png",
    mimeType: "image/png",
    fileData: validBase64,
  }, { token: authorToken });

  const uploadRes = await uploadMediaHandler(uploadReq);
  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 201);
  assert.ok(uploadJson.data.url);
  assert.strictEqual(uploadJson.data.mimeType, "image/png");

  // Invalid mime type rejection
  const invalidUploadReq = createJsonRequest("/api/v1/media/upload", "POST", {
    fileName: "malware.exe",
    mimeType: "application/x-msdownload",
    fileData: validBase64,
  }, { token: authorToken });
  const invalidUploadRes = await uploadMediaHandler(invalidUploadReq);
  assert.strictEqual(invalidUploadRes.status, 400);

  // 8. Input Validation Rejections
  console.log("8. Testing Input Validation Rejections (Empty content, invalid types, stored XSS URLs)...");
  // Empty content
  const emptyContentReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "   ",
    type: "UPDATE",
  }, { token: authorToken });
  const emptyRes = await createPostHandler(emptyContentReq);
  assert.strictEqual(emptyRes.status, 400);

  // Invalid post type
  const invalidTypeReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Valid content",
    type: "INVALID_STORY_TYPE",
  }, { token: authorToken });
  const invalidTypeRes = await createPostHandler(invalidTypeReq);
  assert.strictEqual(invalidTypeRes.status, 400);

  // Stored XSS protocol in links
  const xssLinkReq = createJsonRequest("/api/v1/posts", "POST", {
    content: "Testing stored XSS URL prevention",
    type: "UPDATE",
    links: [{ title: "Malicious", url: "javascript:alert(1)" }],
  }, { token: authorToken });
  const xssRes = await createPostHandler(xssLinkReq);
  assert.strictEqual(xssRes.status, 400);

  // 9. Post Deletion & Cascade Clean up
  console.log("9. Testing Post Deletion as Owner & Storage Key Cleanup...");
  const deleteReq = createJsonRequest(`/api/v1/posts/${createdPostId}`, "DELETE", undefined, { token: authorToken });
  const deleteRes = await deletePostHandler(deleteReq, { params: Promise.resolve({ postId: createdPostId }) });
  const deleteJson = await deleteRes.json();
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteJson.success, true);

  // Confirm post no longer exists
  const postInDb = await prisma.post.findUnique({ where: { id: createdPostId } });
  assert.strictEqual(postInDb, null);

  // Confirm media records cascade deleted
  const mediaInDb = await prisma.postMedia.findMany({ where: { postId: createdPostId } });
  assert.strictEqual(mediaInDb.length, 0);

  // Subsequent GET returns 404
  const getDeletedRes = await getPostHandler(getReq, { params: Promise.resolve({ postId: createdPostId }) });
  assert.strictEqual(getDeletedRes.status, 404);

  // Clean up test data
  await prisma.block.deleteMany({ where: { blockerId: authorUser.id } });
  await prisma.post.deleteMany({ where: { authorId: { in: [authorUser.id, secondUser.id, privateUser.id] } } });
  await prisma.privacySettings.deleteMany({ where: { userId: privateUser.id } });
  await prisma.profile.deleteMany({ where: { userId: { in: [authorUser.id, secondUser.id, privateUser.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [authorUser.id, secondUser.id, privateUser.id] } } });

  console.log("\n>>> ALL PHASE 1 POSTS & MEDIA TESTS PASSED SUCCESSFULLY! <<<");
}
