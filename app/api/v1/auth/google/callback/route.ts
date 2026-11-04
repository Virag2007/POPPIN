import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { successResponse, errorResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return errorResponse(`Google authentication failed: ${error}`, 400, "OAUTH_ERROR");
    }

    if (!code) {
      return errorResponse("Authorization code is missing", 400, "MISSING_OAUTH_CODE");
    }

    const result = await AuthService.handleGoogleCallback(code);

    const response = successResponse(result, 200, "Google authentication successful");
    response.cookies.set("poppin_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    return handleRouteError(err);
  }
}

