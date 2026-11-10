import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    const user = await getAuthenticatedUser(request);
    await MessagingService.markConversationRead(conversationId, user.id);
    return successResponse({ success: true }, 200, "Conversation marked as read");
  } catch (error) {
    return handleRouteError(error);
  }
}

