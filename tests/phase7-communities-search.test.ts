// POPPIN Phase 7: Communities & Search Verification Suite
// Verifies Community CRUD, membership join/leave, slug routing, and global search APIs

import assert from "node:assert";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { CommunityService } from "../services/community.service";
import { SearchService } from "../services/search.service";
import { POST as createCommunityRoute, GET as listCommunitiesRoute } from "../app/api/v1/communities/route";
import { GET as getCommunityRoute } from "../app/api/v1/communities/[slug]/route";
import { POST as joinCommunityRoute, DELETE as leaveCommunityRoute } from "../app/api/v1/communities/[slug]/join/route";
import { GET as searchRoute } from "../app/api/v1/search/route";
import { GET as exploreRoute } from "../app/api/v1/explore/route";
import { NextRequest } from "next/server";

export async function runPhase7CommunitiesSearchTests() {
  console.log("\n==================================================");
  console.log("   POPPIN PHASE 7: COMMUNITIES & SEARCH TESTS     ");
  console.log("==================================================");

  // Setup test users
  const timestamp = Date.now();
  const aliceEmail = `alice_comm_${timestamp}@poppin.social`;
  const bobEmail = `bob_comm_${timestamp}@poppin.social`;

  const alice = await prisma.user.create({
    data: {
      email: aliceEmail,
      tokenVersion: 1,
      profile: {
        create: {
          username: `alice_comm_${timestamp}`,
          displayName: "Alice Community",
        },
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: bobEmail,
      tokenVersion: 1,
      profile: {
        create: {
          username: `bob_comm_${timestamp}`,
          displayName: "Bob Community",
        },
      },
    },
  });

  const aliceToken = signToken({ userId: alice.id, email: alice.email, tokenVersion: 1 });
  const bobToken = signToken({ userId: bob.id, email: bob.email, tokenVersion: 1 });

  // 1. Testing Community Creation via API
  console.log("1. Testing Community Creation via API (POST /api/v1/communities)...");
  const commSlug = `design-guild-${timestamp}`;
  const createReq = new NextRequest("http://localhost:3000/api/v1/communities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aliceToken}`,
    },
    body: JSON.stringify({
      name: "Design Guild",
      slug: commSlug,
      tagline: "Exploring high-craft design systems.",
      description: "Dedicated to micro-interactions and typographic polish.",
      category: "Design",
      avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
      rules: ["Constructive critiques only", "Show real code"],
    }),
  });

  const createRes = await createCommunityRoute(createReq);
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createData.success, true);
  assert.strictEqual(createData.data.slug, commSlug);
  assert.strictEqual(createData.data.isMember, true);
  assert.strictEqual(createData.data.membersCount, 1);

  // 2. Testing Duplicate Community Slug Rejection
  console.log("2. Testing Duplicate Slug Conflict Prevention...");
  const dupReq = new NextRequest("http://localhost:3000/api/v1/communities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aliceToken}`,
    },
    body: JSON.stringify({
      name: "Duplicate Guild",
      slug: commSlug,
      category: "Design",
    }),
  });
  const dupRes = await createCommunityRoute(dupReq);
  const dupData = await dupRes.json();
  assert.strictEqual(dupRes.status, 409);
  assert.strictEqual(dupData.success, false);

  // 3. Testing Community Listing & Filtering
  console.log("3. Testing Community Listing & Filtering (GET /api/v1/communities)...");
  const listReq = new NextRequest(`http://localhost:3000/api/v1/communities?category=Design&search=${commSlug}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  const listRes = await listCommunitiesRoute(listReq);
  const listData = await listRes.json();
  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listData.success, true);
  assert.ok(listData.data.items.length >= 1);
  const found = listData.data.items.find((c: { slug: string }) => c.slug === commSlug);
  assert.ok(found);
  assert.strictEqual(found.isMember, false); // Bob is not yet a member

  // 4. Testing Community Details Retrieval by Slug
  console.log("4. Testing Community Retrieval (GET /api/v1/communities/:slug)...");
  const getReq = new NextRequest(`http://localhost:3000/api/v1/communities/${commSlug}`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  const getRes = await getCommunityRoute(getReq, {
    params: Promise.resolve({ slug: commSlug }),
  });
  const getData = await getRes.json();
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getData.data.slug, commSlug);
  assert.strictEqual(getData.data.rules.length, 2);

  // 5. Testing Join Community
  console.log("5. Testing Join Community (POST /api/v1/communities/:slug/join)...");
  const joinReq = new NextRequest(`http://localhost:3000/api/v1/communities/${commSlug}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  const joinRes = await joinCommunityRoute(joinReq, {
    params: Promise.resolve({ slug: commSlug }),
  });
  const joinData = await joinRes.json();
  assert.strictEqual(joinRes.status, 200);
  assert.strictEqual(joinData.data.joined, true);
  assert.strictEqual(joinData.data.membersCount, 2);

  // 6. Testing Leave Community
  console.log("6. Testing Leave Community (DELETE /api/v1/communities/:slug/join)...");
  const leaveReq = new NextRequest(`http://localhost:3000/api/v1/communities/${commSlug}/join`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  const leaveRes = await leaveCommunityRoute(leaveReq, {
    params: Promise.resolve({ slug: commSlug }),
  });
  const leaveData = await leaveRes.json();
  assert.strictEqual(leaveRes.status, 200);
  assert.strictEqual(leaveData.data.joined, false);
  assert.strictEqual(leaveData.data.membersCount, 1);

  // 7. Testing Global Search API
  console.log("7. Testing Global Search (GET /api/v1/search?q=...)...");
  const searchReq = new NextRequest(`http://localhost:3000/api/v1/search?q=${encodeURIComponent(commSlug)}`);
  const searchRes = await searchRoute(searchReq);
  const searchData = await searchRes.json();
  assert.strictEqual(searchRes.status, 200);
  assert.strictEqual(searchData.success, true);
  assert.ok(searchData.data.communities.length >= 1);
  assert.strictEqual(searchData.data.communities[0].title, "Design Guild");

  // 8. Testing Explore API
  console.log("8. Testing Explore Aggregation (GET /api/v1/explore)...");
  const expReq = new NextRequest("http://localhost:3000/api/v1/explore");
  const expRes = await exploreRoute(expReq);
  const expData = await expRes.json();
  assert.strictEqual(expRes.status, 200);
  assert.strictEqual(expData.success, true);
  assert.ok(Array.isArray(expData.data.featuredCommunities));
  assert.ok(Array.isArray(expData.data.featuredCreators));

  // Clean up test community and users
  await prisma.community.delete({ where: { slug: commSlug } }).catch(() => {});
  await prisma.user.delete({ where: { id: alice.id } }).catch(() => {});
  await prisma.user.delete({ where: { id: bob.id } }).catch(() => {});

  console.log(">>> ALL PHASE 7 COMMUNITIES & SEARCH TESTS PASSED SUCCESSFULLY! <<<");
}

if (require.main === module) {
  runPhase7CommunitiesSearchTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
