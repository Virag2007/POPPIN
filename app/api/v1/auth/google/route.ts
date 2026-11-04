import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export async function GET() {
  const url = AuthService.getGoogleOAuthUrl();
  return NextResponse.redirect(url);
}

