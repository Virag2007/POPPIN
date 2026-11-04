import jwt, { SignOptions } from "jsonwebtoken";
import { JWTPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-poppin-development-only-change-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

