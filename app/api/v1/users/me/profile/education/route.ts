import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { updateEducationSchema } from "@/lib/validation/profile";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateEducationSchema.parse(body);

    const profile = await ProfileService.updateEducation(user.id, validated.education);
    return successResponse(profile, 200, "Education records updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

