import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { POST as createProfileHandler, GET as getProfileHandler, PATCH as updateProfileHandler } from "../app/api/v1/users/me/profile/route";
import { GET as checkUsernameHandler } from "../app/api/v1/usernames/availability/route";
import { GET as getPublicProfileHandler } from "../app/api/v1/profiles/[username]/route";
import { PUT as updateSkillsHandler } from "../app/api/v1/users/me/profile/skills/route";
import { PUT as updateInterestsHandler } from "../app/api/v1/users/me/profile/interests/route";
import { PUT as updateLinksHandler } from "../app/api/v1/users/me/profile/links/route";
import { PUT as updateEducationHandler } from "../app/api/v1/users/me/profile/education/route";
import { PUT as updateExperienceHandler } from "../app/api/v1/users/me/profile/experience/route";

function createJsonRequest(url: string, method: string, body?: any, token?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function runPhase2Tests() {
  console.log("--- Starting Phase 2 Tests: User Profiles ---");

  // Clean and prepare test user
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { in: ["profile_alice@example.com", "profile_bob@example.com"] } },
  });

  const alice = await prisma.user.create({
    data: {
      email: "profile_alice@example.com",
    },
  });
  const aliceToken = signToken({ userId: alice.id, email: alice.email });

  const bob = await prisma.user.create({
    data: {
      email: "profile_bob@example.com",
    },
  });
  const bobToken = signToken({ userId: bob.id, email: bob.email });

  // 1. Check username availability (should be available)
  console.log("1. Testing username availability check...");
  const availReq = createJsonRequest("/api/v1/usernames/availability?username=alice_dev", "GET");
  const availRes = await checkUsernameHandler(availReq);
  const availData = await availRes.json();
  assert.strictEqual(availRes.status, 200);
  assert.strictEqual(availData.data.isAvailable, true);

  // 2. Create Alice's profile
  console.log("2. Testing profile creation...");
  const createReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "POST",
    {
      username: "alice_dev",
      displayName: "Alice Developer",
      headline: "Full-Stack Engineer",
      bio: "Building amazing things",
      location: "San Francisco, CA",
    },
    aliceToken
  );
  const createRes = await createProfileHandler(createReq);
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 201, "Profile creation should return 201");
  assert.strictEqual(createData.data.username, "alice_dev");
  assert.strictEqual(createData.data.headline, "Full-Stack Engineer");

  // 3. Username availability check now returns false
  console.log("3. Testing taken username availability...");
  const takenReq = createJsonRequest("/api/v1/usernames/availability?username=alice_dev", "GET");
  const takenRes = await checkUsernameHandler(takenReq);
  const takenData = await takenRes.json();
  assert.strictEqual(takenData.data.isAvailable, false);

  // 4. Bob trying to claim same username fails with 409
  console.log("4. Testing duplicate username rejection on create...");
  const dupUserReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "POST",
    {
      username: "alice_dev",
    },
    bobToken
  );
  const dupUserRes = await createProfileHandler(dupUserReq);
  assert.strictEqual(dupUserRes.status, 409);

  // 5. Alice trying to create second profile fails with 409
  console.log("5. Testing duplicate profile creation for same user...");
  const secondProfReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "POST",
    {
      username: "alice_alternate",
    },
    aliceToken
  );
  const secondProfRes = await createProfileHandler(secondProfReq);
  assert.strictEqual(secondProfRes.status, 409);

  // 6. Retrieve Alice's own profile
  console.log("6. Testing GET /api/v1/users/me/profile...");
  const getReq = createJsonRequest("/api/v1/users/me/profile", "GET", undefined, aliceToken);
  const getRes = await getProfileHandler(getReq);
  const getData = await getRes.json();
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getData.data.username, "alice_dev");
  assert.strictEqual(getData.data.followersCount, 0);
  assert.strictEqual(getData.data.followingCount, 0);

  // 7. Update profile (PATCH)
  console.log("7. Testing PATCH /api/v1/users/me/profile...");
  const patchReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "PATCH",
    {
      headline: "Senior Software Engineer",
      location: "New York, NY",
    },
    aliceToken
  );
  const patchRes = await updateProfileHandler(patchReq);
  const patchData = await patchRes.json();
  assert.strictEqual(patchRes.status, 200);
  assert.strictEqual(patchData.data.headline, "Senior Software Engineer");
  assert.strictEqual(patchData.data.location, "New York, NY");

  // 8. Update Skills
  console.log("8. Testing PUT /api/v1/users/me/profile/skills...");
  const skillsReq = createJsonRequest(
    "/api/v1/users/me/profile/skills",
    "PUT",
    { skills: ["TypeScript", "Next.js", "Prisma"] },
    aliceToken
  );
  const skillsRes = await updateSkillsHandler(skillsReq);
  const skillsData = await skillsRes.json();
  assert.strictEqual(skillsRes.status, 200);
  assert.deepStrictEqual(skillsData.data.skills, ["TypeScript", "Next.js", "Prisma"]);

  // 9. Update Interests
  console.log("9. Testing PUT /api/v1/users/me/profile/interests...");
  const interestsReq = createJsonRequest(
    "/api/v1/users/me/profile/interests",
    "PUT",
    { interests: ["Open Source", "Distributed Systems"] },
    aliceToken
  );
  const interestsRes = await updateInterestsHandler(interestsReq);
  const interestsData = await interestsRes.json();
  assert.strictEqual(interestsRes.status, 200);
  assert.deepStrictEqual(interestsData.data.interests, ["Open Source", "Distributed Systems"]);

  // 10. Update External Links
  console.log("10. Testing PUT /api/v1/users/me/profile/links...");
  const linksReq = createJsonRequest(
    "/api/v1/users/me/profile/links",
    "PUT",
    {
      links: [
        { title: "GitHub", url: "https://github.com/alice" },
        { title: "Portfolio", url: "https://alice.dev" },
      ],
    },
    aliceToken
  );
  const linksRes = await updateLinksHandler(linksReq);
  const linksData = await linksRes.json();
  assert.strictEqual(linksRes.status, 200);
  assert.strictEqual(linksData.data.links.length, 2);
  assert.strictEqual(linksData.data.links[0].title, "GitHub");

  // 11. Update Education
  console.log("11. Testing PUT /api/v1/users/me/profile/education...");
  const eduReq = createJsonRequest(
    "/api/v1/users/me/profile/education",
    "PUT",
    {
      education: [
        {
          school: "MIT",
          degree: "B.S.",
          fieldOfStudy: "Computer Science",
          startDate: "2018",
          endDate: "2022",
        },
      ],
    },
    aliceToken
  );
  const eduRes = await updateEducationHandler(eduReq);
  const eduData = await eduRes.json();
  assert.strictEqual(eduRes.status, 200);
  assert.strictEqual(eduData.data.education.length, 1);
  assert.strictEqual(eduData.data.education[0].school, "MIT");

  // 12. Update Experience
  console.log("12. Testing PUT /api/v1/users/me/profile/experience...");
  const expReq = createJsonRequest(
    "/api/v1/users/me/profile/experience",
    "PUT",
    {
      experience: [
        {
          company: "Acme Corp",
          title: "Backend Engineer",
          location: "Remote",
          current: true,
        },
      ],
    },
    aliceToken
  );
  const expRes = await updateExperienceHandler(expReq);
  const expData = await expRes.json();
  assert.strictEqual(expRes.status, 200);
  assert.strictEqual(expData.data.experience.length, 1);
  assert.strictEqual(expData.data.experience[0].company, "Acme Corp");

  // 13. Retrieve Public Profile by Username
  console.log("13. Testing GET /api/v1/profiles/[username]...");
  const pubReq = createJsonRequest("/api/v1/profiles/alice_dev", "GET", undefined, aliceToken);
  const pubRes = await getPublicProfileHandler(pubReq, {
    params: Promise.resolve({ username: "alice_dev" }),
  });
  const pubData = await pubRes.json();
  assert.strictEqual(pubRes.status, 200);
  assert.strictEqual(pubData.data.username, "alice_dev");
  assert.strictEqual(pubData.data.displayName, "Alice Developer");
  assert.strictEqual(pubData.data.skills.length, 3);
  assert.strictEqual(pubData.data.followersCount, 0);

  // 14. Retrieve Non-Existent Public Profile
  console.log("14. Testing non-existent public profile returns 404...");
  const notFoundReq = createJsonRequest("/api/v1/profiles/non_existent_user_999", "GET", undefined, aliceToken);
  const notFoundRes = await getPublicProfileHandler(notFoundReq, {
    params: Promise.resolve({ username: "non_existent_user_999" }),
  });
  assert.strictEqual(notFoundRes.status, 404);

  // 15. Testing auto-provisioning profile on PATCH when profile record was missing
  console.log("15. Testing auto-provisioning profile on PATCH when profile was missing...");
  const autoEmail = `test_noprofile_${Date.now()}@poppin.social`;
  const newUser = await prisma.user.create({
    data: {
      email: autoEmail,
      passwordHash: "hash123",
      isEmailVerified: true,
    },
  });
  const newJwt = signToken({ userId: newUser.id, email: newUser.email, tokenVersion: newUser.tokenVersion });

  const patchAutoReq = createJsonRequest(
    "/api/v1/users/me/profile",
    "PATCH",
    {
      displayName: "Self Healed User",
      headline: "Auto-provisioned Profile",
    },
    newJwt
  );
  const patchAutoRes = await updateProfileHandler(patchAutoReq);
  const patchAutoData = await patchAutoRes.json();
  assert.strictEqual(patchAutoRes.status, 200, "Should auto-provision and return 200");
  assert.strictEqual(patchAutoData.data.displayName, "Self Healed User");
  assert.strictEqual(patchAutoData.data.headline, "Auto-provisioned Profile");

  // Clean up
  await prisma.user.delete({ where: { id: newUser.id } });

  console.log(">>> Phase 2 Tests Passed Successfully! <<<\n");
}

if (process.argv[1]?.includes("phase2.test")) {
  runPhase2Tests().catch((err) => {
    console.error("Phase 2 test failure:", err);
    process.exit(1);
  });
}

