import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "./response";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetTime <= now) {
      rateLimitMap.delete(key);
    }
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export interface RateLimitResult {
  isAllowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  headers: Record<string, string>;
}

export function checkRateLimit(
  key: string,
  options: { windowMs: number; max: number }
): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetTime <= now) {
    const record: RateLimitRecord = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitMap.set(key, record);

    return {
      isAllowed: true,
      limit: options.max,
      remaining: options.max - 1,
      resetTime: record.resetTime,
      headers: {
        "X-RateLimit-Limit": String(options.max),
        "X-RateLimit-Remaining": String(options.max - 1),
        "X-RateLimit-Reset": String(Math.ceil(record.resetTime / 1000)),
      },
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, options.max - existing.count);
  const isAllowed = existing.count <= options.max;
  const retryAfterSec = Math.ceil((existing.resetTime - now) / 1000);

  return {
    isAllowed,
    limit: options.max,
    remaining,
    resetTime: existing.resetTime,
    headers: {
      "X-RateLimit-Limit": String(options.max),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(existing.resetTime / 1000)),
      ...(isAllowed ? {} : { "Retry-After": String(retryAfterSec) }),
    },
  };
}

export function enforceRateLimit(
  request: NextRequest,
  prefix: string,
  options: { windowMs: number; max: number } = { windowMs: 60_000, max: 20 }
): { isAllowed: boolean; response?: NextResponse } {
  // If RATE_LIMIT_DISABLED is explicitly set (e.g. during specific automated batch tests), bypass
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return { isAllowed: true };
  }

  const ip = getClientIp(request);
  const key = `${prefix}:${ip}`;
  const result = checkRateLimit(key, options);

  if (!result.isAllowed) {
    const res = errorResponse(
      "Too many requests. Please slow down and try again later.",
      429,
      "RATE_LIMIT_EXCEEDED",
      { retryAfter: result.headers["Retry-After"] }
    );
    for (const [header, val] of Object.entries(result.headers)) {
      res.headers.set(header, val);
    }
    return { isAllowed: false, response: res };
  }

  return { isAllowed: true };
}

export function resetRateLimits() {
  rateLimitMap.clear();
}

