import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/profile.service";
import { createProfileSchema, updateProfileSchema } from "@/lib/validation/profile";
import { successResponse, handleRouteError } from "@/lib/http/response";

// POST /api/v1/users/me/profile - Create own profile
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = createProfileSchema.parse(body);

    const profile = await ProfileService.createProfile(user.id, validated);
    return successResponse(profile, 201, "Profile created successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

// GET /api/v1/users/me/profile - Retrieve own profile
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const profile = await ProfileService.getOwnProfile(user.id);
    return successResponse(profile, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

// PATCH /api/v1/users/me/profile - Edit avatar, cover image, headline, bio, location
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const profile = await ProfileService.updateOwnProfile(user.id, validated);
    return successResponse(profile, 200, "Profile updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

