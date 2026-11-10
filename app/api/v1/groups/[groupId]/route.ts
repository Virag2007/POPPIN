import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { updateGroupSchema } from "@/lib/validation/messaging";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const group = await MessagingService.getGroup(groupId, user.id);
    return successResponse(group, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateGroupSchema.parse(body);

    const updated = await MessagingService.updateGroup(groupId, user.id, validated);
    return successResponse(updated, 200, "Group updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

