// POPPIN Unified Platform Storage Adapter
// Supports Cloudinary & S3 with safe development/test fallback
// Keeps provider secrets strictly server-side

import crypto from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { cloudinary, isCloudinaryConfigured, getCloudinaryCloudName, getCloudinaryApiKey, getCloudinaryApiSecret } from "./cloudinary";

export interface UploadResult {
  url: string;
  key: string;
  mimeType: string;
  size: number;
}

export interface StorageAdapter {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<boolean>;
}

export class MockLocalStorageAdapter implements StorageAdapter {
  async upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const url = `https://storage.poppin.io/${key}`;
    return {
      url,
      key,
      mimeType,
      size: fileBuffer.length,
    };
  }

  async delete(_key: string): Promise<boolean> {
    void _key;
    return true;
  }
}

export class CloudinaryStorageAdapter implements StorageAdapter {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  async upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "poppin/uploads",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Cloudinary upload failed"));
          }
          resolve({
            url: result.secure_url,
            key: result.public_id,
            mimeType: mimeType || `image/${result.format}`,
            size: result.bytes,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  async delete(key: string): Promise<boolean> {
    try {
      const res = await cloudinary.uploader.destroy(key);
      return res.result === "ok" || res.result === "not found";
    } catch {
      return false;
    }
  }
}

export class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(
    bucket: string,
    region: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    endpoint?: string
  ) {
    this.bucket = bucket;
    this.region = region;
    this.s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials:
        (accessKeyId || process.env.AWS_ACCESS_KEY_ID) && (secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY)
          ? {
              accessKeyId: accessKeyId || process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY!,
            }
          : undefined,
    });
  }

  async upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `media/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitizedName}`;

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        })
      );
    }

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return {
      url,
      key,
      mimeType,
      size: fileBuffer.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    }
    return true;
  }
}

export function getStorageProvider(): StorageAdapter {
  if (isCloudinaryConfigured()) {
    const cloudName = getCloudinaryCloudName()!;
    const apiKey = getCloudinaryApiKey()!;
    const apiSecret = getCloudinaryApiSecret()!;
    return new CloudinaryStorageAdapter(cloudName, apiKey, apiSecret);
  }

  if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
    return new S3StorageAdapter(
      process.env.AWS_S3_BUCKET,
      process.env.AWS_REGION,
      process.env.AWS_ACCESS_KEY_ID,
      process.env.AWS_SECRET_ACCESS_KEY,
      process.env.AWS_S3_ENDPOINT
    );
  }

  return new MockLocalStorageAdapter();
}
