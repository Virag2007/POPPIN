import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { updateLinksSchema } from "@/lib/validation/profile";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateLinksSchema.parse(body);

    const profile = await ProfileService.updateLinks(user.id, validated.links);
    return successResponse(profile, 200, "External links updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

