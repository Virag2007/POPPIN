import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { resendVerificationSchema } from "@/lib/validation/auth";
import { successResponse, handleRouteError } from "@/lib/http/response";
import { enforceRateLimit } from "@/lib/http/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitCheck = enforceRateLimit(request, "auth:resend-verification", { windowMs: 60_000, max: 10 });
    if (!rateLimitCheck.isAllowed && rateLimitCheck.response) {
      return rateLimitCheck.response;
    }

    const body = await request.json();
    const validated = resendVerificationSchema.parse(body);

    const result = await AuthService.resendVerification(validated);
    return successResponse(result, 200, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}

