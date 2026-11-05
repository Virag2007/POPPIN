import { NextRequest } from "next/server";
import { getOptionalAuthenticatedUser } from "@/lib/auth/middleware";
import { ConnectionService } from "@/services/connection.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const viewer = await getOptionalAuthenticatedUser(request);
    const result = await ConnectionService.getFollowers(userId, limit, offset, viewer?.id);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
