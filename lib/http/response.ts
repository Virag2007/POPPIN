import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

  console.error("Unhandled Route Error:", error);
  return errorResponse("Internal server error", 500, "INTERNAL_SERVER_ERROR");
}

