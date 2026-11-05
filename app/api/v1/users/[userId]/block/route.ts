import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { AccountService } from "@/services/account.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { userId: targetUserId } = await context.params;

    const result = await AccountService.blockUser(user.id, targetUserId);
    return successResponse(result, 200, "User successfully blocked");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { userId: targetUserId } = await context.params;

    const result = await AccountService.unblockUser(user.id, targetUserId);
    return successResponse(result, 200, "User successfully unblocked");
  } catch (error) {
    return handleRouteError(error);
  }
}

