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
