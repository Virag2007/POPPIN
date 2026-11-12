import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOptions } from "../config/cors";
import { authMiddleware } from "./middleware/auth";
import { configureSocketAdapter } from "./adapter";
import { handleUserConnect } from "./handlers/presence.handler";
import { registerConversationHandlers } from "./handlers/conversation.handler";
import { registerMessageHandlers } from "./handlers/message.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { AppSocket, SocketData } from "../types/socket";
import { ClientToServerEvents, ServerToClientEvents } from "../types/events";
import { Logger } from "../lib/logger";

export async function createSocketServer(
  httpServer: HttpServer
): Promise<Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: corsOptions,
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1 MB
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: false,
    },
  });

  // Pluggable adapter (Redis or In-Memory)
  await configureSocketAdapter(io as any);

  // Authentication Middleware
  io.use(authMiddleware);

  // Connection Handler
  io.on("connection", async (socket: AppSocket) => {
    try {
      await handleUserConnect(io as any, socket);
      registerConversationHandlers(io as any, socket);
      registerMessageHandlers(io as any, socket);
      registerTypingHandlers(io as any, socket);
    } catch (error) {
      Logger.error(`[Socket] Error registering handlers for socket ${socket.id}:`, error);
      socket.disconnect(true);
    }
  });

  return io;
}

