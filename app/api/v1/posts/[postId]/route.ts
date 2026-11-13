import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { PostService } from "@/services/post.service";
import { updatePostSchema } from "@/lib/validation/post";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const viewer = await getAuthenticatedUser(request);
    const post = await PostService.getPost(postId, viewer.id);
    return successResponse(post, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updatePostSchema.parse(body);

    const updated = await PostService.updatePost(postId, user.id, validated);
    return successResponse(updated, 200, "Post updated successfully");
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
    const result = await PostService.deletePost(postId, user.id);
    return successResponse(result, 200, "Post deleted successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

