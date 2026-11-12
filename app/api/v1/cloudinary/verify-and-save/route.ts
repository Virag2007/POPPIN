import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { prisma } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/storage/cloudinary";
import {
  cloudinaryVerifyAndSaveSchema,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_FORMATS,
} from "@/lib/validation/cloudinary";
import { successResponse, handleRouteError, AppError } from "@/lib/http/response";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req);

    // 2. Enforce rate limit (30 confirmations / minute)
    const rateLimit = enforceRateLimit(req, `cloudinary:verify:${user.id}`, {
      windowMs: 60_000,
      max: 30,
    });
    if (!rateLimit.isAllowed && rateLimit.response) {
      return rateLimit.response;
    }

    // 3. Validate client input
    const body = await req.json();
    const validated = cloudinaryVerifyAndSaveSchema.parse(body);

    let verifiedWidth = validated.width;
    let verifiedHeight = validated.height;
    let verifiedBytes = validated.bytes;
    let verifiedFormat = validated.format;
    let verifiedSecureUrl = validated.secureUrl;

    // 4. Server-Side Asset Verification with Cloudinary API
    if (isCloudinaryConfigured()) {
      try {
        const resource = await cloudinary.api.resource(validated.publicId, {
          resource_type: "image",
        });

        if (!resource) {
          throw new AppError("Asset could not be verified on Cloudinary", 400, "ASSET_NOT_FOUND");
        }

        // Verify folder prefix matches expected application structure
        const expectedPrefix = `poppin/${validated.folder}`;
        if (!resource.public_id.startsWith(expectedPrefix)) {
          throw new AppError("Asset folder path mismatch", 403, "FOLDER_MISMATCH");
        }

        // Verify size limit server-side
        if (resource.bytes && resource.bytes > MAX_IMAGE_SIZE_BYTES) {
          throw new AppError("Uploaded image exceeds 10MB maximum size limit", 400, "IMAGE_TOO_LARGE");
        }

        // Verify format
        const formatLower = (resource.format || "").toLowerCase();
        if (formatLower && !ALLOWED_IMAGE_FORMATS.includes(formatLower as typeof ALLOWED_IMAGE_FORMATS[number])) {
          throw new AppError(`Uploaded image format (${formatLower}) is not permitted`, 400, "INVALID_FORMAT");
        }

        verifiedWidth = resource.width || verifiedWidth;
        verifiedHeight = resource.height || verifiedHeight;
        verifiedBytes = resource.bytes || verifiedBytes;
        verifiedFormat = formatLower || verifiedFormat;
        verifiedSecureUrl = resource.secure_url || verifiedSecureUrl;
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to verify asset with Cloudinary API", 400, "VERIFICATION_FAILED");
      }
    }

    // 5. Persist verified media metadata in Prisma
    const savedMedia = await prisma.media.upsert({
      where: { publicId: validated.publicId },
      create: {
        publicId: validated.publicId,
        secureUrl: verifiedSecureUrl,
        resourceType: "image",
        format: verifiedFormat,
        width: verifiedWidth,
        height: verifiedHeight,
        bytes: verifiedBytes,
        folder: validated.folder,
        altText: validated.altText,
        userId: user.id,
      },
      update: {
        secureUrl: verifiedSecureUrl,
        width: verifiedWidth,
        height: verifiedHeight,
        bytes: verifiedBytes,
        altText: validated.altText,
      },
    });

    return successResponse(savedMedia, 201, "Media verified and persisted successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

