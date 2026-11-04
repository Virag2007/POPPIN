import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { OnboardingService } from "@/services/onboarding.service";
import { onboardingStep2Schema } from "@/lib/validation/onboarding";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = onboardingStep2Schema.parse(body);

    const result = await OnboardingService.saveStep2(user.id, validated);
    return successResponse(result, 200, "Step 2 saved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
