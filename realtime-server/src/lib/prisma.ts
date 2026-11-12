import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { Logger } from "./logger";

function resolveDatabaseUrl(url: string): string {
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const separator = url.includes("?") ? "&" : "?";
    const params: string[] = [];
    if (!url.includes("connect_timeout=")) params.push("connect_timeout=30");
    if (!url.includes("pool_timeout=")) params.push("pool_timeout=30");
    if (!url.includes("connection_limit=")) params.push("connection_limit=10");
    if (params.length > 0) {
      return `${url}${separator}${params.join("&")}`;
    }
  }
  return url;
}

const baseClient = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(env.DATABASE_URL),
    },
  },
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Provide robust transaction timeout (25s) for serverless/pooled PostgreSQL connections
export const prisma = baseClient.$extends({
  client: {
    async $transaction<R>(
      fn: (tx: any) => Promise<R>,
      options?: { maxWait?: number; timeout?: number; isolationLevel?: any }
    ): Promise<R> {
      return (baseClient as any).$transaction(fn, {
        maxWait: 10000,
        timeout: 25000,
        ...options,
      });
    },
  },
}) as unknown as PrismaClient;

baseClient
  .$connect()
  .then(() => Logger.info("Prisma connected successfully to PostgreSQL"))
  .catch((err) => Logger.error("Prisma connection failure:", err));
