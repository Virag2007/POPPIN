import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { updateExperienceSchema } from "@/lib/validation/profile";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateExperienceSchema.parse(body);

    const profile = await ProfileService.updateExperience(user.id, validated.experience);
    return successResponse(profile, 200, "Experience records updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

