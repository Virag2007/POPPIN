import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validation/auth";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const result = await AuthService.login(validated);

    const response = successResponse(result, 200, "Login successful");
    response.cookies.set("poppin_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

