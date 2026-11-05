import { NextRequest } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { successResponse, errorResponse, handleRouteError } from "@/lib/http/response";
import { enforceRateLimit } from "@/lib/http/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitCheck = enforceRateLimit(request, "usernames:availability", {
      windowMs: 60_000,
      max: 60,
    });
    if (!rateLimitCheck.isAllowed && rateLimitCheck.response) {
      return rateLimitCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return errorResponse("username query parameter is required", 400, "MISSING_QUERY_PARAMETER");
    }

    const result = await ProfileService.checkUsernameAvailability(username);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
