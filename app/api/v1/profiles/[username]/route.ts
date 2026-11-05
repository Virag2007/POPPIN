import { NextRequest } from "next/server";
import { getOptionalAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const viewer = await getOptionalAuthenticatedUser(request);
    const profile = await ProfileService.getPublicProfileByUsername(username, viewer?.id);
    return successResponse(profile, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
