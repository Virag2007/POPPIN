import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ConnectionService } from "@/services/connection.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const requests = await ConnectionService.getPendingFollowRequests(user.id);
    return successResponse(requests, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

