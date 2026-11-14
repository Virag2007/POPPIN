import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Optimizes a PostgreSQL connection URL for serverless poolers (Neon / Supabase).
 */
export function optimizePostgresUrl(rawUrl: string): string {
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

/**
 * Asserts that a database connection URL is configured before running queries.
 */
export function assertDatabaseConfigured(): string {
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SQLITE_DATABASE_URL;

  if (!rawUrl || !rawUrl.trim()) {
    throw new Error(
      "Database connection URL is not configured. Please set DATABASE_URL (for PostgreSQL) or SQLITE_DATABASE_URL (for SQLite) in your environment variables."
    );
  }

  return optimizePostgresUrl(rawUrl.trim());
}

/**
 * Resolves the database connection URL.
 */
export function resolveDatabaseUrl(): string {
  return assertDatabaseConfigured();
}

function createPrismaClient(): PrismaClient {
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SQLITE_DATABASE_URL;

  const url = rawUrl && rawUrl.trim() ? optimizePostgresUrl(rawUrl.trim()) : undefined;

  const baseClient = new PrismaClient({
    datasources: url
      ? {
          db: {
            url,
          },
        }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          assertDatabaseConfigured();
          return query(args);
        },
      },
    },
    client: {
      async $connect() {
        assertDatabaseConfigured();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (baseClient as any).$connect();
      },
      async $transaction<R>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fn: (tx: any) => Promise<R>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options?: { maxWait?: number; timeout?: number; isolationLevel?: any }
      ): Promise<R> {
        assertDatabaseConfigured();
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
 * Defers client access and database URL validation until first actual runtime query/access.
 * Ensures Next.js build-time page-data collection succeeds even if build environment lacks database credentials.
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
