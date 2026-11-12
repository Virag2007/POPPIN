import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { successResponse, handleRouteError } from "@/lib/http/response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const mediaList = await prisma.media.findMany({
      where: {
        userId: user.id,
        ...(folder ? { folder } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return successResponse(mediaList, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

