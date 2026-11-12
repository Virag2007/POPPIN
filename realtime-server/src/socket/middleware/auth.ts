import { Socket } from "socket.io";
import { verifyAuthToken } from "../../lib/jwt";
import { Logger } from "../../lib/logger";
import { SocketData } from "../../types/socket";

export interface AuthError extends Error {
  data?: { code: string };
}

export function authMiddleware(
  socket: Socket<any, any, any, SocketData>,
  next: (err?: AuthError) => void
) {
  try {
    // Extract token from handshake auth or Authorization header
    let token: string | undefined = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    if (!token) {
      Logger.warn(`[Auth] Connection rejected: No authentication token provided (socket: ${socket.id})`);
      const err = new Error("Authentication failed: No token provided") as AuthError;
      err.data = { code: "UNAUTHORIZED" };
      return next(err);
    }

    const decoded = verifyAuthToken(token);
    if (!decoded || !decoded.userId) {
      Logger.warn(`[Auth] Connection rejected: Invalid or expired token (socket: ${socket.id})`);
      const err = new Error("Authentication failed: Invalid or expired token") as AuthError;
      err.data = { code: "INVALID_TOKEN" };
      return next(err);
    }

    // Attach verified user context to socket instance
    socket.data.user = {
      id: decoded.userId,
      email: decoded.email,
      tokenVersion: decoded.tokenVersion,
    };
    socket.data.connectedAt = new Date();

    Logger.debug(`[Auth] Socket ${socket.id} authenticated for user ${decoded.userId}`);
    next();
  } catch (error) {
    Logger.error("[Auth] Unexpected authentication error:", error);
    const err = new Error("Internal authentication error") as AuthError;
    err.data = { code: "INTERNAL_ERROR" };
    next(err);
  }
}
