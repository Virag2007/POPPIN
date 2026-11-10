import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { addGroupMemberSchema } from "@/lib/validation/messaging";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = addGroupMemberSchema.parse(body);

    const result = await MessagingService.addGroupMember(groupId, user.id, validated.userId);
    return successResponse({ success: result }, 200, "Member added to group");
  } catch (error) {
    return handleRouteError(error);
  }
}

