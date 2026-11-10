import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { PostService } from "@/services/post.service";
import { uploadMediaPayloadSchema } from "@/lib/validation/post";
import { successResponse, handleRouteError, AppError } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    const contentType = request.headers.get("content-type") || "";

    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        throw new AppError("No file uploaded in form field 'file'", 400, "MISSING_FILE");
      }

      const fileObj = file as File;
      fileName = fileObj.name || `upload_${Date.now()}`;
      mimeType = fileObj.type || "application/octet-stream";
      const arrayBuffer = await fileObj.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON body with base64 encoded content
      const body = await request.json();
      const validated = uploadMediaPayloadSchema.parse(body);

      fileName = validated.fileName;
      mimeType = validated.mimeType;
      fileBuffer = Buffer.from(validated.fileData, "base64");
    }

    const uploadResult = await PostService.uploadMedia(fileBuffer, fileName, mimeType);
    return successResponse(uploadResult, 201, "Media uploaded successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

