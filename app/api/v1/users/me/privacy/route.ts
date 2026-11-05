import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { AccountService } from "@/services/account.service";
import { updatePrivacySchema } from "@/lib/validation/account";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const privacy = await AccountService.getPrivacy(user.id);
    return successResponse(privacy, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updatePrivacySchema.parse(body);

    const updated = await AccountService.updatePrivacy(user.id, validated);
    return successResponse(updated, 200, "Privacy settings updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

