import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { JWTPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-poppin-development-only-change-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_ALGORITHM = "HS256";

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: JWT_ALGORITHM,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const options: VerifyOptions = {
      algorithms: [JWT_ALGORITHM],
    };
    const decoded = jwt.verify(token, JWT_SECRET, options) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
