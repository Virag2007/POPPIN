import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Load environment from current dir or root project
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env.local") });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,https://poppin.vercel.app")
    .transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean)),
  REDIS_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("[RealtimeServer] Invalid environment configuration:", result.error.format());
    throw new Error("Invalid environment configuration for realtime-server");
  }
  return result.data;
}

export const env = parseEnv();

