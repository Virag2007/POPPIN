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

// Protected web page paths that strictly require an authenticated session
const PROTECTED_PREFIXES = [
  "/feed",
  "/messages",
  "/profile",
  "/profiles",
  "/settings",
  "/onboarding",
  "/communities",
  "/explore",
  "/posts",
  "/notifications",
];

// Whitelisted public API endpoints that do not require an active session
const PUBLIC_API_ENDPOINTS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/google",
  "/api/v1/auth/google/callback",
  "/api/v1/usernames/availability",
  "/api/cloudinary/signature",
];

// Auth pages where already logged-in users are redirected to /feed
const AUTH_PAGES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieToken = request.cookies.get("poppin_token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
  const token = cookieToken || bearerToken;

  // 1. CORS & Strict Authentication Policy for /api/ routes
  if (pathname.startsWith("/api/")) {
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

    // Check if this API endpoint is strictly protected
    const isPublicApi = PUBLIC_API_ENDPOINTS.some(
      (endpoint) => pathname === endpoint || pathname.startsWith(`${endpoint}/`)
    );

    if (!isPublicApi && !token) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access this resource",
          },
        },
        { status: 401 }
      );

      if (origin && isAllowedOrigin) {
        errorResponse.headers.set("Access-Control-Allow-Origin", origin);
        errorResponse.headers.set("Access-Control-Allow-Credentials", "true");
      }
      return errorResponse;
    }

    const response = NextResponse.next();

    if (origin && isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  }

  // 2. Web Application Pages

  // Redirect authenticated users away from /login and /register
  if (AUTH_PAGES.some((authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`))) {
    if (token) {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
    return NextResponse.next();
  }

  // Strictly protected app routes require a verified token
  if (PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - brand assets (/brand/...)
     * - image assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
