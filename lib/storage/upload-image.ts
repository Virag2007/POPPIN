import {
  AllowedUploadFolder,
  ALLOWED_IMAGE_FORMATS,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validation/cloudinary";

export interface UploadOptions {
  folder: AllowedUploadFolder;
  altText?: string;
  onProgress?: (percentage: number) => void;
  signal?: AbortSignal;
  retries?: number;
}

export interface UploadedMediaResult {
  id?: string;
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder: AllowedUploadFolder;
  altText?: string;
}

export interface BatchUploadResult {
  successful: UploadedMediaResult[];
  failed: Array<{ file: File; error: string }>;
}

/**
 * Validates file format and size constraints in the browser before upload starts
 */
export function validateImageFile(file: File): void {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  const isFormatAllowed =
    ALLOWED_IMAGE_FORMATS.some((fmt) => extension === fmt || mimeType === `image/${fmt}`) ||
    mimeType === "image/jpeg";

  if (!isFormatAllowed) {
    throw new Error(
      `Unsupported format "${file.type || extension}". Allowed formats: ${ALLOWED_IMAGE_FORMATS.join(", ")}`
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB`
    );
  }
}

/**
 * Gets authentication headers from localStorage or cookies
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("poppin_jwt");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Uploads a single image directly from the browser to Cloudinary using signed parameters.
 * Persists verified metadata in Prisma via /api/v1/cloudinary/verify-and-save.
 */
export async function uploadImage(
  file: File,
  options: UploadOptions
): Promise<UploadedMediaResult> {
  const { folder, altText, onProgress, signal, retries = 2 } = options;

  // 1. Client-side pre-validation
  validateImageFile(file);

  let attempt = 0;
  while (attempt <= retries) {
    try {
      if (signal?.aborted) {
        throw new DOMException("Upload aborted by user", "AbortError");
      }

      // 2. Fetch upload signature from backend
      const sigRes = await fetch("/api/v1/cloudinary/signature", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ folder }),
        signal,
      });

      if (!sigRes.ok) {
        const errorData = await sigRes.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || errorData?.message || "Failed to generate upload signature"
        );
      }

      const sigEnvelope = await sigRes.json();
      const credentials = sigEnvelope.data || sigEnvelope;

      // 3. Fallback dev/mock upload if Cloudinary is not configured with secrets
      if (credentials.mock) {
        onProgress?.(50);
        const mockPublicId = `poppin/${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const mockUrl = `https://storage.poppin.io/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        const saveRes = await fetch("/api/v1/cloudinary/verify-and-save", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            publicId: mockPublicId,
            secureUrl: mockUrl,
            resourceType: "image",
            format: (file.name.split(".").pop() || "jpg").toLowerCase(),
            bytes: file.size,
            folder,
            altText,
          }),
          signal,
        });

        onProgress?.(100);

        if (!saveRes.ok) {
          const errData = await saveRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Failed to persist media metadata");
        }

        const savedData = await saveRes.json();
        return {
          id: savedData.data?.id,
          publicId: mockPublicId,
          url: mockUrl,
          secureUrl: mockUrl,
          format: file.name.split(".").pop() || "jpg",
          bytes: file.size,
          folder,
          altText,
        };
      }

      // 4. Direct signed upload to Cloudinary API using XMLHttpRequest for progress
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", credentials.apiKey);
      formData.append("timestamp", String(credentials.timestamp));
      formData.append("signature", credentials.signature);
      formData.append("folder", credentials.folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`;

      const uploadResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        if (signal) {
          signal.addEventListener("abort", () => {
            xhr.abort();
            reject(new DOMException("Upload aborted by user", "AbortError"));
          });
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 90);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(err);
            }
          } else {
            let errorMsg = "Cloudinary upload failed";
            try {
              const res = JSON.parse(xhr.responseText);
              errorMsg = res?.error?.message || errorMsg;
            } catch {
              // ignore
            }
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new TypeError("Network error during direct Cloudinary upload"));
        xhr.open("POST", cloudinaryUrl);
        xhr.send(formData);
      });

      // 5. Verify & Persist metadata on backend
      const saveRes = await fetch("/api/v1/cloudinary/verify-and-save", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          resourceType: "image",
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          folder,
          altText,
        }),
        signal,
      });

      onProgress?.(100);

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || "Failed to persist media metadata");
      }

      const savedData = await saveRes.json();
      const mediaRecord = savedData.data || {};

      return {
        id: mediaRecord.id,
        publicId: String(uploadResult.public_id),
        url: String(uploadResult.secure_url || uploadResult.url),
        secureUrl: String(uploadResult.secure_url),
        format: String(uploadResult.format),
        width: typeof uploadResult.width === "number" ? uploadResult.width : undefined,
        height: typeof uploadResult.height === "number" ? uploadResult.height : undefined,
        bytes: typeof uploadResult.bytes === "number" ? uploadResult.bytes : undefined,
        folder,
        altText,
      };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }

      attempt++;
      if (attempt > retries) {
        throw err;
      }
      // Exponential backoff
      await new Promise((res) => setTimeout(res, attempt * 500));
    }
  }

  throw new Error("Upload failed after maximum retries");
}

/**
 * Uploads multiple images in parallel with aggregate progress reporting
 */
export async function uploadMultipleImages(
  files: File[],
  options: Omit<UploadOptions, "onProgress">,
  onTotalProgress?: (overallPercentage: number) => void
): Promise<BatchUploadResult> {
  const fileProgress: number[] = new Array(files.length).fill(0);
  const successful: UploadedMediaResult[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  const updateOverall = () => {
    if (onTotalProgress && files.length > 0) {
      const total = fileProgress.reduce((a, b) => a + b, 0);
      onTotalProgress(Math.round(total / files.length));
    }
  };

  const uploadPromises = files.map(async (file, index) => {
    try {
      const res = await uploadImage(file, {
        ...options,
        onProgress: (p) => {
          fileProgress[index] = p;
          updateOverall();
        },
      });
      successful.push(res);
    } catch (err: unknown) {
      failed.push({
        file,
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  });

  await Promise.all(uploadPromises);
  return { successful, failed };
}
