import { NextRequest } from "next/server";
import { getAuthenticatedUser, getOptionalAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/community.service";
import { createCommunitySchema } from "@/lib/validation/community";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const viewer = await getOptionalAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const cursor = searchParams.get("cursor") || undefined;

    const result = await CommunityService.listCommunities(
      { category, search, limit, cursor },
      viewer?.id
    );

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = createCommunitySchema.parse(body);

    const community = await CommunityService.createCommunity(validated, user.id);
    return successResponse(community, 201, "Community created successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

