import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/community.service";
import { CommunityRepository } from "@/repositories/community.repository";
import { AppError, successResponse, handleRouteError } from "@/lib/http/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { slug } = await params;

    // Resolve by slug first, or fallback to id
    const comm = (await CommunityRepository.findBySlug(slug)) || (await CommunityRepository.findById(slug));

    if (!comm) {
      throw new AppError(`Community "${slug}" does not exist`, 404, "COMMUNITY_NOT_FOUND");
    }

    const result = await CommunityService.joinCommunity(comm.id, user.id);
    return successResponse(result, 200, "Successfully joined community");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { slug } = await params;

    const comm = (await CommunityRepository.findBySlug(slug)) || (await CommunityRepository.findById(slug));

    if (!comm) {
      throw new AppError(`Community "${slug}" does not exist`, 404, "COMMUNITY_NOT_FOUND");
    }

    const result = await CommunityService.leaveCommunity(comm.id, user.id);
    return successResponse(result, 200, "Successfully left community");
  } catch (error) {
    return handleRouteError(error);
  }
}
