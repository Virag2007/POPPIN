import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { AppError } from "@/lib/http/response";
import { prisma } from "@/lib/db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    // Check cookie fallback
    const cookieToken = request.cookies.get("poppin_token")?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
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
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("Authenticated user no longer exists", 401, "USER_NOT_FOUND");
  }

  return user;
}

export function checkOwnership(resourceOwnerId: string, currentUserId: string, message = "Access forbidden: you do not own this resource") {
  if (resourceOwnerId !== currentUserId) {
    throw new AppError(message, 403, "FORBIDDEN");
  }
}

