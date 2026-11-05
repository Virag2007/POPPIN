import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function successResponse<T>(data: T, status = 200, message?: string) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return NextResponse.json(payload, { status });
}

export function errorResponse(message: string, status = 400, code = "BAD_REQUEST", details?: unknown) {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(payload, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    return errorResponse("Validation error", 400, "VALIDATION_ERROR", error.flatten().fieldErrors);
  }

  if (error instanceof SyntaxError && "message" in error && (error.message.includes("JSON") || error.message.includes("Unexpected"))) {
    return errorResponse("Invalid or malformed JSON payload", 400, "INVALID_JSON");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : String(error.meta?.target || "unique field");
      return errorResponse(`A record with this ${target} already exists`, 409, "CONFLICT", { target: error.meta?.target });
    }
    if (error.code === "P2025") {
      return errorResponse("The requested record was not found", 404, "NOT_FOUND");
    }
  }

  console.error("Unhandled Route Error:", error);
  return errorResponse("Internal server error", 500, "INTERNAL_SERVER_ERROR");
}
