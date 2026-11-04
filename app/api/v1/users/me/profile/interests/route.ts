import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { updateInterestsSchema } from "@/lib/validation/profile";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateInterestsSchema.parse(body);

    const profile = await ProfileService.updateInterests(user.id, validated.interests);
    return successResponse(profile, 200, "Interests updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

