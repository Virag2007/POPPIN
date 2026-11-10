import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { createDirectConversationSchema } from "@/lib/validation/messaging";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const conversations = await MessagingService.getConversations(user.id);
    return successResponse(conversations, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = createDirectConversationSchema.parse(body);

    const conversation = await MessagingService.getOrCreateDirectConversation(
      user.id,
      validated.recipientId
    );
    return successResponse(conversation, 201, "Conversation ready");
  } catch (error) {
    return handleRouteError(error);
  }
}

