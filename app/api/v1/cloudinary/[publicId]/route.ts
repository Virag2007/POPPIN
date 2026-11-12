import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { prisma } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/storage/cloudinary";
import { successResponse, handleRouteError, AppError } from "@/lib/http/response";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { publicId: rawPublicId } = await params;
    const publicId = decodeURIComponent(rawPublicId);

    // Rate limit
    const rateLimit = enforceRateLimit(req, `cloudinary:del:${user.id}`, {
      windowMs: 60_000,
      max: 30,
    });
    if (!rateLimit.isAllowed && rateLimit.response) {
      return rateLimit.response;
    }

    // 1. Look up media in Prisma
    const media = await prisma.media.findUnique({
      where: { publicId },
    });

    if (!media) {
      throw new AppError("Media not found", 404, "NOT_FOUND");
    }

    // 2. Strict Ownership Verification: Users can only delete their own images
    if (media.userId !== user.id) {
      throw new AppError("You do not have permission to delete this media asset", 403, "FORBIDDEN");
    }

    // 3. Delete from Cloudinary if configured
    if (isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (err) {
        console.error("Cloudinary asset deletion warning:", err);
        // Continue to delete local record so orphaned DB rows do not linger
      }
    }

    // 4. Delete record from database
    await prisma.media.delete({
      where: { id: media.id },
    });

    return successResponse(
      { deleted: true, publicId },
      200,
      "Media asset deleted successfully"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

