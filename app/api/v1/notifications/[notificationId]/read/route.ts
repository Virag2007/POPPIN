import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { NotificationService } from "@/services/notification.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await context.params;
    const user = await getAuthenticatedUser(request);
    await NotificationService.markAsRead(notificationId, user.id);
    return successResponse({ success: true }, 200, "Notification marked as read");
  } catch (error) {
    return handleRouteError(error);
  }
}
