import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/community.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; requestId: string }> }
) {
  try {
    const { slug, requestId } = await params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const action = (body.action || "APPROVE").toUpperCase() as "APPROVE" | "REJECT";

    const result = await CommunityService.reviewJoinRequest(slug, requestId, action, user.id);
    return successResponse(result, 200, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}
