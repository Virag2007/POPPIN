import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { PostService } from "@/services/post.service";
import { createPostSchema } from "@/lib/validation/post";
import { successResponse, handleRouteError } from "@/lib/http/response";

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

