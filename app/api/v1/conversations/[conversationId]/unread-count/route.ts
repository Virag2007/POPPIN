import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const unreadCount = await MessagingService.getUnreadCount(conversationId, user.id);
    return successResponse({ unreadCount }, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

