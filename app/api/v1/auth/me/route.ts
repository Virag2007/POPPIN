import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { successResponse, handleRouteError } from "@/lib/http/response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    return successResponse(user, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

