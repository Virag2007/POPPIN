import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { AccountService } from "@/services/account.service";
import { updateAccountSchema } from "@/lib/validation/account";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const account = await AccountService.getAccount(user.id);
    return successResponse(account, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateAccountSchema.parse(body);

    const updated = await AccountService.updateAccount(user.id, validated);
    return successResponse(updated, 200, "Account details updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

