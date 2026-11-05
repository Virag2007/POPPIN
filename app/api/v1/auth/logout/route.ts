import { NextRequest } from "next/server";
import { getOptionalAuthenticatedUser } from "@/lib/auth/middleware";
import { UserRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthenticatedUser(request);
  if (user) {
    await UserRepository.revokeSessions(user.id);
  }

  const response = successResponse({ loggedOut: true }, 200, "Successfully logged out");
  // Clear auth cookie
  response.cookies.set("poppin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}


