import { NextRequest, NextResponse } from "next/server";

// Allowed origins for CORS (configurable via env)
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim());
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply CORS policy to /api/ routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production");

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    const preflightHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
      "Access-Control-Max-Age": "86400",
    };

    if (origin && isAllowedOrigin) {
      preflightHeaders["Access-Control-Allow-Origin"] = origin;
      preflightHeaders["Access-Control-Allow-Credentials"] = "true";
    }

    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    });
  }

  const response = NextResponse.next();

  if (origin && isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};

