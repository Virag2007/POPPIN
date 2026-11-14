import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/community.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const { slug, userId } = await params;
    const user = await getAuthenticatedUser(request);
    const result = await CommunityService.removeMember(slug, userId, user.id);
    return successResponse(result, 200, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const { slug, userId } = await params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const newRole = body.role as "ADMIN" | "MODERATOR" | "MEMBER";

    const result = await CommunityService.updateMemberRole(slug, userId, newRole, user.id);
    return successResponse(result, 200, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}

