import { env } from "./env";

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser requests or matching origins
    if (!origin) {
      return callback(null, true);
    }

    if (env.NODE_ENV === "development") {
      return callback(null, true);
    }

    const isAllowed = env.ALLOWED_ORIGINS.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed === origin) return true;
      try {
        const allowedHost = new URL(allowed).host;
        const originHost = new URL(origin).host;
        return allowedHost === originHost;
      } catch {
        return false;
      }
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
};

