import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; userId: string }> }
) {
  try {
    const { groupId, userId } = await context.params;
    const adminUser = await getAuthenticatedUser(request);

    const result = await MessagingService.removeGroupMember(groupId, adminUser.id, userId);
    return successResponse({ success: result }, 200, "Member removed from group");
  } catch (error) {
    return handleRouteError(error);
  }
}

