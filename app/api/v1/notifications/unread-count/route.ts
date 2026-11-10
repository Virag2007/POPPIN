import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { NotificationService } from "@/services/notification.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const unreadCount = await NotificationService.getUnreadCount(user.id);
    return successResponse({ unreadCount }, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
