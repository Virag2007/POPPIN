import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export async function GET() {
  const { url, state } = AuthService.getGoogleOAuthUrl();
  const response = NextResponse.redirect(url);

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
