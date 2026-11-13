import "./load-env";
import prisma from "../lib/db";
import bcrypt from "bcryptjs";

let testPassed = 0;
let testFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testPassed++;
  } else {
    console.error(`  ✗ ${message}`);
    testFailed++;
  }
}

async function runPersistenceTests() {
  console.log("\n==================================================");
  console.log("  POPPIN — Database Persistence & Integrity Suite");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testEmail = `test_persist_${timestamp}@poppin.local`;
  const testUsername = `test_${timestamp.toString().slice(-8)}`;

  let createdUserId: string | null = null;
  let createdPostId: string | null = null;
  let createdCommentId: string | null = null;

  try {
    // 1. Verify Database Provider
    console.log("[Test 1] Database Provider Verification");
    const rawUrl = process.env.DATABASE_URL || "";
    assert(rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"), "Connecting to PostgreSQL (Neon)");

    // 2. Verify Core Seed Data
    console.log("\n[Test 2] Seed Data Verification");
    const communityCount = await prisma.community.count();
    assert(communityCount >= 5, `Communities seeded in PostgreSQL (found ${communityCount})`);

    const userCount = await prisma.user.count();
    assert(userCount >= 5, `Users present in PostgreSQL (found ${userCount})`);

    const postCount = await prisma.post.count();
    assert(postCount >= 5, `Posts present in PostgreSQL (found ${postCount})`);

    // 3. User & Profile Write Durability
    console.log("\n[Test 3] User & Profile Creation Durability");
    const passwordHash = await bcrypt.hash("TestPass123!", 8);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        profile: {
          create: {
            username: testUsername,
            displayName: "Persistence Test User",
            headline: "Automated QA Specialist",
            bio: "Verifying live database persistence on Neon PostgreSQL.",
            skills: JSON.stringify(["TypeScript", "PostgreSQL", "QA"]),
            interests: JSON.stringify(["Databases", "Distributed Systems"]),
          },
        },
        onboarding: {
          create: {
            isCompleted: true,
            step: 3,
            role: "Automated QA Specialist",
            headline: "Automated QA Specialist",
            skills: JSON.stringify(["TypeScript", "PostgreSQL"]),
            interests: JSON.stringify(["Databases"]),
          },
        },
        privacySettings: {
          create: {
            isPrivate: false,
            showActivityStatus: true,
            allowTagging: true,
          },
        },
      },
      include: {
        profile: true,
        onboarding: true,
        privacySettings: true,
      },
    });

    createdUserId = user.id;
    assert(!!user.id, `User created with id: ${user.id}`);
    assert(user.profile?.username === testUsername, `Profile linked with username: @${testUsername}`);
    assert(user.onboarding?.isCompleted === true, "Onboarding record initialized and completed");
    assert(user.privacySettings?.isPrivate === false, "Privacy settings record initialized");

    // 4. Post Creation with Community Linking
    console.log("\n[Test 4] Post Creation & Community Linking");
    const targetCommunity = await prisma.community.findFirst({
      where: { slug: "design-craft" },
    });
    assert(!!targetCommunity, "Found target community #design-craft");

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        communityId: targetCommunity?.id,
        content: "Testing real-time database durability and cascade integrity.",
        type: "UPDATE",
        tags: JSON.stringify(["qa", "persistence", "neon"]),
        links: JSON.stringify([]),
        media: {
          create: {
            url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
            mimeType: "image/jpeg",
            order: 0,
          },
        },
      },
      include: {
        author: {
          include: { profile: true },
        },
        community: true,
        media: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    createdPostId = post.id;
    assert(!!post.id, `Post persisted in PostgreSQL with id: ${post.id}`);
    assert(post.community?.slug === "design-craft", "Post correctly linked to community");
    assert(post.media.length === 1, "Media attachment linked in PostMedia");

    // 5. Comment Threading & Cascade Verification
    console.log("\n[Test 5] Comment Threading & Interaction");
    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        content: "First persistent test comment.",
      },
    });
    createdCommentId = comment.id;
    assert(!!comment.id, `Comment persisted with id: ${comment.id}`);

    const like = await prisma.like.create({
      data: {
        postId: post.id,
        userId: user.id,
      },
    });
    assert(!!like.id, "Like persisted in PostgreSQL");

    // 6. Cascade Cleanup Test
    console.log("\n[Test 6] Cascade Delete Verification");
    await prisma.user.delete({
      where: { id: user.id },
    });

    const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(deletedUser === null, "User deleted successfully");

    const deletedProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    assert(deletedProfile === null, "Profile cascaded and deleted");

    const deletedPost = await prisma.post.findUnique({ where: { id: post.id } });
    assert(deletedPost === null, "Post authored by user cascaded and deleted");

    const deletedComment = await prisma.comment.findUnique({ where: { id: comment.id } });
    assert(deletedComment === null, "Comment on post cascaded and deleted");

    createdUserId = null;
    createdPostId = null;
    createdCommentId = null;

    console.log("\n==================================================");
    console.log(`  SUITE RESULT: ${testPassed} Passed | ${testFailed} Failed`);
    console.log("==================================================\n");

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Test Suite Execution Error:", error);

    // Clean up if failure occurred before cascade
    if (createdPostId) {
      await prisma.post.delete({ where: { id: createdPostId } }).catch(() => {});
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPersistenceTests();

