import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { NotificationService } from "@/services/notification.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const result = await NotificationService.markAllAsRead(user.id);
    return successResponse(result, 200, "All notifications marked as read");
  } catch (error) {
    return handleRouteError(error);
  }
}
