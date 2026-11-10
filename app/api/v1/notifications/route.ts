import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { NotificationService } from "@/services/notification.service";
import { paginationQuerySchema } from "@/lib/validation/engagement";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const url = new URL(request.url);
    const rawQuery = {
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };
    const query = paginationQuerySchema.parse(rawQuery);

    const result = await NotificationService.getNotifications(user.id, query.limit, query.cursor);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
