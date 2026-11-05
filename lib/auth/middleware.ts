import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { AppError } from "@/lib/http/response";
import { prisma } from "@/lib/db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;
  let isCookieAuth = false;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    // Check cookie fallback
    const cookieToken = request.cookies.get("poppin_token")?.value;
    if (cookieToken) {
      token = cookieToken;
      isCookieAuth = true;
    }
  }

  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  // CSRF Defense-in-Depth for Cookie-Based Authentication
  // If the request uses cookie auth on a state-changing method, verify Origin/Referer matches
  if (isCookieAuth && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") || request.nextUrl.host || new URL(request.url).host;

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (host && originHost !== host) {
          throw new AppError("Cross-site request forgery validation failed", 403, "CSRF_FORBIDDEN");
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Invalid origin header", 403, "CSRF_FORBIDDEN");
      }
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (host && refererHost !== host) {
          throw new AppError("Cross-site request forgery validation failed", 403, "CSRF_FORBIDDEN");
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Invalid referer header", 403, "CSRF_FORBIDDEN");
      }
    }
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    throw new AppError("Invalid or expired authentication token", 401, "INVALID_TOKEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("Authenticated user no longer exists", 401, "USER_NOT_FOUND");
  }

  // Token revocation verification (e.g. password changed or logged out everywhere)
  if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
    throw new AppError("Session has expired or was revoked. Please log in again.", 401, "SESSION_REVOKED");
  }

  return user;
}

export function checkOwnership(resourceOwnerId: string, currentUserId: string, message = "Access forbidden: you do not own this resource") {
  if (resourceOwnerId !== currentUserId) {
    throw new AppError(message, 403, "FORBIDDEN");
  }
}
