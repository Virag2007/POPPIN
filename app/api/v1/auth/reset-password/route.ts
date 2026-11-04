import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    const result = await AuthService.resetPassword(validated.token, validated.newPassword);
    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

