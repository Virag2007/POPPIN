import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { OnboardingService } from "@/services/onboarding.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const status = await OnboardingService.getOnboardingStatus(user.id);
    return successResponse(status, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
