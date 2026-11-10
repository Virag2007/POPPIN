import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { EngagementService } from "@/services/engagement.service";
import { updateCommentSchema } from "@/lib/validation/engagement";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateCommentSchema.parse(body);

    const updated = await EngagementService.updateComment(commentId, user.id, validated.content);
    return successResponse(updated, 200, "Comment updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const result = await EngagementService.deleteComment(commentId, user.id);
    return successResponse(result, 200, "Comment deleted successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

