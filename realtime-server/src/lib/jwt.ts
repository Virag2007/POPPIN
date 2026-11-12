import jwt, { VerifyOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface DecodedAuthToken {
  userId: string;
  email: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export function verifyAuthToken(token: string): DecodedAuthToken | null {
  try {
    const options: VerifyOptions = {
      algorithms: ["HS256"],
    };
    const decoded = jwt.verify(token, env.JWT_SECRET, options) as DecodedAuthToken;
    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

