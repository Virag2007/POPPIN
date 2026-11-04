import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ConnectionService } from "@/services/connection.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);

    const suggestions = await ConnectionService.getSuggestedPeople(user.id, limit);
    return successResponse(suggestions, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
