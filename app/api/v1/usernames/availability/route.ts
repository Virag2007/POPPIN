import { NextRequest } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { successResponse, errorResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
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

