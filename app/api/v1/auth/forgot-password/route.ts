import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { successResponse, handleRouteError } from "@/lib/http/response";
import { enforceRateLimit } from "@/lib/http/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimitCheck = enforceRateLimit(request, "auth:forgot-password", { windowMs: 60_000, max: 10 });
    if (!rateLimitCheck.isAllowed && rateLimitCheck.response) {
      return rateLimitCheck.response;
    }

    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    const result = await AuthService.forgotPassword(validated.email);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
