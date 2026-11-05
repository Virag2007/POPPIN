import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { AccountService } from "@/services/account.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const result = await AccountService.deleteAccount(user.id);

    const response = successResponse(result, 200, "Account deleted successfully");

    // Clear session cookie
    response.cookies.set("poppin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

