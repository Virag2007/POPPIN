import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ConnectionService } from "@/services/connection.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { userId: targetUserId } = await context.params;

    const result = await ConnectionService.followUser(user.id, targetUserId);
    return successResponse(result, 201, "Successfully followed user");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { userId: targetUserId } = await context.params;

    const result = await ConnectionService.unfollowUser(user.id, targetUserId);
    return successResponse(result, 200, "Successfully unfollowed user");
  } catch (error) {
    return handleRouteError(error);
  }
}
