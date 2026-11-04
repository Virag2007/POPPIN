import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { OnboardingService } from "@/services/onboarding.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const result = await OnboardingService.completeOnboarding(user.id);
    return successResponse(result, 200, "Onboarding completed successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
