import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Resolves the active database connection URL.
 * Supports pooled PostgreSQL (DATABASE_URL / POSTGRES_PRISMA_URL) and local SQLite (SQLITE_DATABASE_URL).
 */
export function resolveDatabaseUrl(): string {
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SQLITE_DATABASE_URL;

  if (!rawUrl) {
    throw new Error(
      "Database connection URL is not configured. Please set DATABASE_URL (for PostgreSQL) or SQLITE_DATABASE_URL (for SQLite) in your environment variables."
    );
  }

  // Optimize PostgreSQL connections for serverless poolers (Neon / Supabase)
  if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
    try {
      const url = new URL(rawUrl);
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "30");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "30");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "10");
      }
      return url.toString();
    } catch {
      return rawUrl;
    }
  }

  return rawUrl;
}

function createPrismaClient(): PrismaClient {
  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

  // Provide robust transaction timeout (25s) for serverless/pooled PostgreSQL connections
  return baseClient.$extends({
    client: {
      async $transaction<R>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fn: (tx: any) => Promise<R>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options?: { maxWait?: number; timeout?: number; isolationLevel?: any }
      ): Promise<R> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (baseClient as any).$transaction(fn, {
          maxWait: 10000,
          timeout: 25000,
          ...options,
        });
      },
    },
  }) as unknown as PrismaClient;
}

// Lazy initialization cache to protect build-time module evaluation
let clientInstance: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (global.prisma) {
    return global.prisma;
  }
  if (!clientInstance) {
    clientInstance = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      global.prisma = clientInstance;
    }
  }
  return clientInstance;
}

// Non-invoking properties that Next.js / React / bundlers inspect during build time
const IGNORED_PROPS = new Set([
  "then",
  "catch",
  "finally",
  "$$typeof",
  "toJSON",
  "valueOf",
  "toString",
]);

/**
 * Proxy-based Prisma client export.
 * Defers client creation and database URL validation until first actual runtime query/access.
 * This prevents build-time module evaluation failures while strictly enforcing validation at runtime.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (typeof prop === "string" && IGNORED_PROPS.has(prop)) {
      return undefined;
    }
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
