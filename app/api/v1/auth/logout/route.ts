import { successResponse } from "@/lib/http/response";

export async function POST() {
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

