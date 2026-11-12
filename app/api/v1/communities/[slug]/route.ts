import { NextRequest } from "next/server";
import { getOptionalAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/community.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getOptionalAuthenticatedUser(request);

    const community = await CommunityService.getCommunityBySlug(slug, viewer?.id);
    return successResponse(community, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

