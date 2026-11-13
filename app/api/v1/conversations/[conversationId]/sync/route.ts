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
    const url = new URL(request.url);
    const since = url.searchParams.get("since") || undefined;

    const result = await MessagingService.syncMessages(conversationId, user.id, since);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
