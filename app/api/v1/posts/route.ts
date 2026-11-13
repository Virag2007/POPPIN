import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { PostService } from "@/services/post.service";
import { createPostSchema } from "@/lib/validation/post";
import { successResponse, handleRouteError, AppError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const cursor = searchParams.get("cursor") || undefined;

    if (!authorId) {
      throw new AppError("Author ID parameter is required", 400, "MISSING_PARAMETER");
    }

    const result = await PostService.getPostsByAuthor(authorId, user.id, limit, cursor);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = createPostSchema.parse(body);

    const post = await PostService.createPost(user.id, validated);
    return successResponse(post, 201, "Post created successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
