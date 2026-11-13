import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ConnectionService } from "@/services/connection.service";
import { successResponse, handleRouteError, AppError } from "@/lib/http/response";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string; followerId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { userId, followerId } = await context.params;

    if (user.id !== userId) {
      throw new AppError("You can only remove followers from your own account", 403, "FORBIDDEN");
    }

    const result = await ConnectionService.removeFollower(user.id, followerId);
    return successResponse(result, 200, "Follower removed");
  } catch (error) {
    return handleRouteError(error);
  }
}

