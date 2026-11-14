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
    const user = await getAuthenticatedUser(request);
    const requests = await CommunityService.getJoinRequests(slug, user.id);
    return successResponse(requests, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
