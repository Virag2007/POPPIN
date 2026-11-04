import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { updateSkillsSchema } from "@/lib/validation/profile";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateSkillsSchema.parse(body);

    const profile = await ProfileService.updateSkills(user.id, validated.skills);
    return successResponse(profile, 200, "Skills updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

