import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { OnboardingService } from "@/services/onboarding.service";
import { onboardingImagesSchema } from "@/lib/validation/onboarding";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = onboardingImagesSchema.parse(body);

    const result = await OnboardingService.saveImages(user.id, validated);
    return successResponse(result, 200, "Images saved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

