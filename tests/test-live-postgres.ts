import assert from "node:assert";
import { loadEnvConfig } from "@next/env";

// Load environment variables (.env, .env.local)
loadEnvConfig(process.cwd());

import { prisma } from "../lib/db";

export async function runLivePostgresVerification() {
  console.log("==================================================");
  console.log("   TESTING LIVE NEON POSTGRESQL CONNECTIVITY      ");
  console.log("==================================================");

  // 1. Verify environment
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  console.log("1. Checking environment variables...");
  assert.ok(databaseUrl, "DATABASE_URL is required in environment");
  assert.ok(
    databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"),
    "DATABASE_URL must be a PostgreSQL connection string"
  );
  console.log("   ✓ DATABASE_URL protocol: postgresql");

  assert.ok(directUrl, "DIRECT_URL is required in environment");
  assert.ok(
    directUrl.startsWith("postgres://") || directUrl.startsWith("postgresql://"),
    "DIRECT_URL must be a PostgreSQL connection string"
  );
  console.log("   ✓ DIRECT_URL protocol: postgresql");

  // 2. Test raw query / version check
  console.log("2. Testing connection with raw SELECT query...");
  const rawResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version();`;
  assert.ok(rawResult && rawResult.length > 0, "Failed to query database version");
  console.log("   ✓ Connected successfully! Engine:", rawResult[0].version.split(" ")[0]);

  // 3. Test user & profile creation in transaction
  console.log("3. Testing User, Profile & Media creation on PostgreSQL...");
  const timestamp = Date.now();
  const testEmail = `neon_test_${timestamp}@poppin.social`;
  const testUsername = `neon_user_${timestamp}`;

  const createdUser = await prisma.user.create({
    data: {
      email: testEmail,
      tokenVersion: 1,
      profile: {
        create: {
          username: testUsername,
          displayName: "Neon Tester",
          bio: "Verifying Neon PostgreSQL on POPPIN",
          skills: JSON.stringify(["PostgreSQL", "Next.js", "Prisma"]),
        },
      },
    },
    include: {
      profile: true,
    },
  });

  assert.ok(createdUser.id, "User ID should be generated");
  assert.strictEqual(createdUser.email, testEmail);
  assert.ok(createdUser.profile, "Profile should be created via relation");
  assert.strictEqual(createdUser.profile?.username, testUsername);
  console.log("   ✓ User and Profile successfully created in PostgreSQL! ID:", createdUser.id);

  // 4. Test Media model creation and relation
  const testPublicId = `poppin/posts/neon_test_${timestamp}`;
  const mediaRecord = await prisma.media.create({
    data: {
      publicId: testPublicId,
      secureUrl: `https://res.cloudinary.com/test/${testPublicId}.webp`,
      resourceType: "image",
      format: "webp",
      width: 1920,
      height: 1080,
      bytes: 102400,
      folder: "posts",
      altText: "Test Neon Media",
      userId: createdUser.id,
    },
  });

  assert.ok(mediaRecord.id);
  assert.strictEqual(mediaRecord.publicId, testPublicId);
  assert.strictEqual(mediaRecord.userId, createdUser.id);
  console.log("   ✓ Media record successfully persisted! Public ID:", mediaRecord.publicId);

  // 5. Test querying relations
  console.log("4. Testing relational query retrieval...");
  const fetchedUser = await prisma.user.findUnique({
    where: { id: createdUser.id },
    include: {
      profile: true,
      media: true,
    },
  });

  assert.ok(fetchedUser);
  assert.strictEqual(fetchedUser.media.length, 1);
  assert.strictEqual(fetchedUser.media[0].publicId, testPublicId);
  console.log("   ✓ Relational query verified with 1 media item and profile!");

  // 6. Test Cascade deletion
  console.log("5. Testing Cascade deletion on User...");
  await prisma.user.delete({
    where: { id: createdUser.id },
  });

  const checkMedia = await prisma.media.findUnique({
    where: { publicId: testPublicId },
  });
  assert.strictEqual(checkMedia, null, "Media should be cascade deleted");

  const checkProfile = await prisma.profile.findUnique({
    where: { username: testUsername },
  });
  assert.strictEqual(checkProfile, null, "Profile should be cascade deleted");
  console.log("   ✓ Cascade delete verified: User, Profile, and Media removed cleanly!");

  console.log("\n>>> NEON POSTGRESQL INTEGRATION 100% OPERATIONAL! <<<\n");
}

if (process.argv[1]?.includes("test-live-postgres")) {
  runLivePostgresVerification()
    .catch((err) => {
      console.error("PostgreSQL verification failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
