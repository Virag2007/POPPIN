import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { MessagingService } from "@/services/messaging.service";
import { createGroupSchema } from "@/lib/validation/messaging";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = createGroupSchema.parse(body);

    const group = await MessagingService.createGroup(user.id, validated);
    return successResponse(group, 201, "Group created successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

