import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import {
  cloudinary,
  isCloudinaryConfigured,
  getCloudinaryCloudName,
  getCloudinaryApiKey,
  getCloudinaryApiSecret,
} from "@/lib/storage/cloudinary";
import {
  cloudinarySignatureRequestSchema,
  ALLOWED_IMAGE_FORMATS,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validation/cloudinary";
import { handleRouteError } from "@/lib/http/response";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req);

    // 2. Enforce sliding-window rate limit (30 signature requests / minute)
    const rateLimit = enforceRateLimit(req, `cloudinary:sig:${user.id}`, {
      windowMs: 60_000,
      max: 30,
    });
    if (!rateLimit.isAllowed && rateLimit.response) {
      return rateLimit.response;
    }

    // 3. Validate request payload
    const body = await req.json();
    const validated = cloudinarySignatureRequestSchema.parse(body);

    const timestamp = Math.floor(Date.now() / 1000);
    const targetFolder = `poppin/${validated.folder}`;

    // 4. If Cloudinary is configured, generate cryptographic signature
    if (isCloudinaryConfigured()) {
      const cloudName = getCloudinaryCloudName()!;
      const apiKey = getCloudinaryApiKey()!;
      const apiSecret = getCloudinaryApiSecret()!;

      const paramsToSign: Record<string, string | number> = {
        folder: targetFolder,
        timestamp,
      };

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      const responseData = {
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder: targetFolder,
        maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
        allowedFormats: ALLOWED_IMAGE_FORMATS,
        mock: false,
      };

      // Returns both unified envelope and direct fields for client compatibility
      return NextResponse.json({
        success: true,
        data: responseData,
        ...responseData,
      });
    }

    // 5. Safe Development/Mock Fallback when Cloudinary API Secret is not yet provided
    const mockCloudName = getCloudinaryCloudName() || "poppin-mock";
    const mockApiKey = getCloudinaryApiKey() || "mock-api-key";

    const mockResponseData = {
      signature: "mock_signature_for_dev_mode",
      timestamp,
      cloudName: mockCloudName,
      apiKey: mockApiKey,
      folder: targetFolder,
      maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
      allowedFormats: ALLOWED_IMAGE_FORMATS,
      mock: true,
    };

    return NextResponse.json({
      success: true,
      data: mockResponseData,
      ...mockResponseData,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
