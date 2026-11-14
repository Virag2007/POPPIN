import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/community.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getAuthenticatedUser(request);

    const community = await CommunityService.getCommunityBySlug(slug, viewer.id);
    return successResponse(community, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getAuthenticatedUser(request);

    const result = await CommunityService.deleteCommunity(slug, user.id);
    return successResponse(result, 200, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}

