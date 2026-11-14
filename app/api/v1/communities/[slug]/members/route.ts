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
    await getAuthenticatedUser(request);
    const members = await CommunityService.getCommunityMembers(slug);
    return successResponse(members, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

