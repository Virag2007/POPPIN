import { runPhase0ContractTests } from "./phase0-contracts.test";
import { runPhase1PostsTests } from "./phase1-posts.test";
import { runPhase2EngagementTests } from "./phase2-engagement.test";
import { runPhase3FeedTests } from "./phase3-feed.test";
import { runPhase4MessagingTests } from "./phase4-messaging.test";
import { runPhase5NotificationsTests } from "./phase5-notifications.test";
import { runPhase6IntegrationTests } from "./phase6-integration.test";
import { runPhase1Tests } from "./phase1.test";
import { runPhase2Tests } from "./phase2.test";
import { runPhase3Tests } from "./phase3.test";
import { runPhase4Tests } from "./phase4.test";
import { runPhase5Tests } from "./phase5.test";
import { runE2EIntegrationTests } from "./e2e-integration.test";
import { runSecurityAuditTests } from "./security-audit.test";

async function runAll() {
  console.log("==================================================");
  console.log("      POPPIN FULL TEST SUITE RUNNER              ");
  console.log("==================================================\n");

  const start = Date.now();

  try {
    await runPhase0ContractTests();
    await runPhase1PostsTests();
    await runPhase2EngagementTests();
    await runPhase3FeedTests();
    await runPhase4MessagingTests();
    await runPhase5NotificationsTests();
    await runPhase6IntegrationTests();
    await runPhase1Tests();
    await runPhase2Tests();
    await runPhase3Tests();
    await runPhase4Tests();
    await runPhase5Tests();
    await runE2EIntegrationTests();
    await runSecurityAuditTests();

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log("==================================================");
    console.log(` ALL PHASES, E2E & SECURITY AUDIT PASSED in ${elapsed}s! `);
    console.log("==================================================");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runAll();
