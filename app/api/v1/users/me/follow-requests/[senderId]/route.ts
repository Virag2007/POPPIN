import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ConnectionService } from "@/services/connection.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ senderId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { senderId } = await context.params;

    const result = await ConnectionService.approveFollowRequest(user.id, senderId);
    return successResponse(result, 200, "Follow request approved");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ senderId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { senderId } = await context.params;

    const result = await ConnectionService.rejectFollowRequest(user.id, senderId);
    return successResponse(result, 200, "Follow request rejected");
  } catch (error) {
    return handleRouteError(error);
  }
}

