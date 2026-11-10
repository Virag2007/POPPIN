import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { sendMessageSchema } from "@/lib/validation/messaging";
import { paginationQuerySchema } from "@/lib/validation/engagement";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const url = new URL(request.url);
    const rawQuery = {
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };
    const query = paginationQuerySchema.parse(rawQuery);

    const result = await MessagingService.getMessages(
      conversationId,
      user.id,
      query.limit,
      query.cursor
    );
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const message = await MessagingService.sendMessage(
      conversationId,
      user.id,
      validated.content
    );
    return successResponse(message, 201, "Message sent successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

