import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { signToken } from "../lib/auth/jwt";
import { GET as getOnboardingHandler } from "../app/api/v1/onboarding/route";
import { PUT as step1Handler } from "../app/api/v1/onboarding/step-1/route";
import { PUT as step2Handler } from "../app/api/v1/onboarding/step-2/route";
import { GET as followSuggestionsHandler } from "../app/api/v1/onboarding/follow-suggestions/route";
import { POST as completeOnboardingHandler } from "../app/api/v1/onboarding/complete/route";

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

export async function runPhase3Tests() {
  console.log("--- Starting Phase 3 Tests: Three-step Onboarding ---");

  // Clean onboarding and test users
  await prisma.follow.deleteMany();
  await prisma.block.deleteMany();
  await prisma.onboarding.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "onboard_user@example.com",
          "candidate_1@example.com",
          "candidate_2@example.com",
          "blocked_candidate@example.com",
        ],
      },
    },
  });

  // Create test user for onboarding
  const testUser = await prisma.user.create({
    data: {
      email: "onboard_user@example.com",
      profile: {
        create: {
          username: "onboard_user",
          displayName: "Onboard User",
        },
      },
    },
  });
  const token = signToken({ userId: testUser.id, email: testUser.email });

  // Create candidates for follow suggestions
  const candidate1 = await prisma.user.create({
    data: {
      email: "candidate_1@example.com",
      profile: {
        create: {
          username: "tech_leader",
          displayName: "Tech Leader",
          headline: "VP of Engineering",
        },
      },
    },
  });

  const candidate2 = await prisma.user.create({
    data: {
      email: "candidate_2@example.com",
      profile: {
        create: {
          username: "designer_pro",
          displayName: "Designer Pro",
          headline: "Product Designer",
        },
      },
    },
  });

  const blockedUser = await prisma.user.create({
    data: {
      email: "blocked_candidate@example.com",
      profile: {
        create: {
          username: "blocked_guy",
          displayName: "Blocked Guy",
          headline: "Spammer",
        },
      },
    },
  });

  // Block the blockedUser
  await prisma.block.create({
    data: {
      blockerId: testUser.id,
      blockedId: blockedUser.id,
    },
  });

  // 1. Initial Onboarding Status (Fresh user)
  console.log("1. Testing Initial Onboarding Status...");
  const initReq = createJsonRequest("/api/v1/onboarding", "GET", undefined, token);
  const initRes = await getOnboardingHandler(initReq);
  const initData = await initRes.json();
  assert.strictEqual(initRes.status, 200);
  assert.strictEqual(initData.data.isCompleted, false);
  assert.strictEqual(initData.data.step, 1);

  // 2. Step 1 Validation (Empty fields)
  console.log("2. Testing Step 1 Validation...");
  const invalidStep1Req = createJsonRequest(
    "/api/v1/onboarding/step-1",
    "PUT",
    { role: "", headline: "" },
    token
  );
  const invalidStep1Res = await step1Handler(invalidStep1Req);
  assert.strictEqual(invalidStep1Res.status, 400, "Empty role/headline should return 400");

  // 3. Step 1 Success (Save role and headline)
  console.log("3. Testing Step 1 Save...");
  const step1Req = createJsonRequest(
    "/api/v1/onboarding/step-1",
    "PUT",
    { role: "Backend Developer", headline: "Building scalable distributed systems" },
    token
  );
  const step1Res = await step1Handler(step1Req);
  const step1Data = await step1Res.json();
  assert.strictEqual(step1Res.status, 200);
  assert.strictEqual(step1Data.data.role, "Backend Developer");
  assert.strictEqual(step1Data.data.headline, "Building scalable distributed systems");
  assert.strictEqual(step1Data.data.step, 2);

  // Verify synced to profile
  const updatedProfile = await prisma.profile.findUnique({ where: { userId: testUser.id } });
  assert.strictEqual(updatedProfile?.headline, "Building scalable distributed systems");

  // 4. Complete Onboarding prematurely (Should fail before step 2)
  console.log("4. Testing Premature Complete Rejection...");
  const prematureReq = createJsonRequest("/api/v1/onboarding/complete", "POST", undefined, token);
  const prematureRes = await completeOnboardingHandler(prematureReq);
  assert.strictEqual(prematureRes.status, 400, "Completing without step 2 should return 400");

  // 5. Step 2 Validation (Empty skills/interests)
  console.log("5. Testing Step 2 Validation...");
  const invalidStep2Req = createJsonRequest(
    "/api/v1/onboarding/step-2",
    "PUT",
    { skills: [], interests: [] },
    token
  );
  const invalidStep2Res = await step2Handler(invalidStep2Req);
  assert.strictEqual(invalidStep2Res.status, 400, "Empty skills/interests should return 400");

  // 6. Step 2 Success (Save skills and interests)
  console.log("6. Testing Step 2 Save...");
  const step2Req = createJsonRequest(
    "/api/v1/onboarding/step-2",
    "PUT",
    {
      skills: ["TypeScript", "Node.js", "Prisma"],
      interests: ["System Architecture", "Open Source"],
    },
    token
  );
  const step2Res = await step2Handler(step2Req);
  const step2Data = await step2Res.json();
  assert.strictEqual(step2Res.status, 200);
  assert.deepStrictEqual(step2Data.data.skills, ["TypeScript", "Node.js", "Prisma"]);
  assert.strictEqual(step2Data.data.step, 3);

  // 7. Follow Suggestions during onboarding (Step 3)
  console.log("7. Testing Follow Suggestions (excludes self and blocked)...");
  const suggestReq = createJsonRequest("/api/v1/onboarding/follow-suggestions", "GET", undefined, token);
  const suggestRes = await followSuggestionsHandler(suggestReq);
  const suggestData = await suggestRes.json();
  assert.strictEqual(suggestRes.status, 200);
  assert.ok(Array.isArray(suggestData.data));
  const suggestedUsernames = suggestData.data.map((u: any) => u.username);
  assert.ok(suggestedUsernames.includes("tech_leader"), "Should suggest candidate 1");
  assert.ok(suggestedUsernames.includes("designer_pro"), "Should suggest candidate 2");
  assert.ok(!suggestedUsernames.includes("onboard_user"), "Must NOT suggest self");
  assert.ok(!suggestedUsernames.includes("blocked_guy"), "Must NOT suggest blocked user");

  // 8. Complete Onboarding
  console.log("8. Testing Mark Onboarding Complete...");
  const completeReq = createJsonRequest("/api/v1/onboarding/complete", "POST", undefined, token);
  const completeRes = await completeOnboardingHandler(completeReq);
  const completeData = await completeRes.json();
  assert.strictEqual(completeRes.status, 200);
  assert.strictEqual(completeData.data.isCompleted, true);
  assert.strictEqual(completeData.data.step, 3);

  // 9. Verify Final Onboarding Status
  console.log("9. Testing Final Onboarding Status Retrieval...");
  const finalReq = createJsonRequest("/api/v1/onboarding", "GET", undefined, token);
  const finalRes = await getOnboardingHandler(finalReq);
  const finalData = await finalRes.json();
  assert.strictEqual(finalRes.status, 200);
  assert.strictEqual(finalData.data.isCompleted, true);
  assert.strictEqual(finalData.data.role, "Backend Developer");
  assert.strictEqual(finalData.data.skills.length, 3);

  // 10. Unauthenticated Access Protection
  console.log("10. Testing Unauthenticated Access Protection...");
  const unauthReq = createJsonRequest("/api/v1/onboarding", "GET");
  const unauthRes = await getOnboardingHandler(unauthReq);
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated request should return 401");

  console.log(">>> Phase 3 Tests Passed Successfully! <<<\n");
}

if (process.argv[1]?.includes("phase3.test")) {
  runPhase3Tests().catch((err) => {
    console.error("Phase 3 test failure:", err);
    process.exit(1);
  });
}
