import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { registerSchema } from "@/lib/validation/auth";
import { successResponse, handleRouteError } from "@/lib/http/response";
import { enforceRateLimit } from "@/lib/http/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitCheck = enforceRateLimit(request, "auth:register", { windowMs: 60_000, max: 20 });
    if (!rateLimitCheck.isAllowed && rateLimitCheck.response) {
      return rateLimitCheck.response;
    }

    const body = await request.json();
    const validated = registerSchema.parse(body);

    const result = await AuthService.register(validated);

    const response = successResponse(result, 201, "User registered successfully");
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
