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

    // No session cookie is set here: the account must verify its email address
    // first. The verify-email endpoint issues the session token.
    return successResponse(result, 201, "User registered successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
