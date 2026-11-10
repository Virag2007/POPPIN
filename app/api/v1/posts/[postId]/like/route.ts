import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { EngagementService } from "@/services/engagement.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const result = await EngagementService.likePost(user.id, postId);
    return successResponse(result, 200, "Post liked successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const result = await EngagementService.unlikePost(user.id, postId);
    return successResponse(result, 200, "Post unliked successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

