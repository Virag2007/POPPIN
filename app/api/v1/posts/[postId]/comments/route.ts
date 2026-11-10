import { NextRequest } from "next/server";
import { getAuthenticatedUser, getOptionalAuthenticatedUser } from "@/lib/auth/middleware";
import { EngagementService } from "@/services/engagement.service";
import { createCommentSchema } from "@/lib/validation/engagement";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const viewer = await getOptionalAuthenticatedUser(request);
    const comments = await EngagementService.getComments(postId, viewer?.id);
    return successResponse(comments, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    const comment = await EngagementService.createComment(postId, user.id, validated);
    return successResponse(comment, 201, "Comment added successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

