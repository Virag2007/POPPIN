import { Server } from "socket.io";
import { env } from "../config/env";
import { Logger } from "../lib/logger";

export async function configureSocketAdapter(io: Server): Promise<void> {
  if (!env.REDIS_URL) {
    Logger.info("Socket.IO initialized with high-performance In-Memory adapter (Single-instance mode)");
    return;
  }

  try {
    Logger.info(`Configuring Socket.IO Redis adapter connecting to: ${env.REDIS_URL.replace(/:[^:@]+@/, ":***@")}`);
    // Dynamic import to avoid hard dependency when Redis is not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createAdapter } = require("@socket.io/redis-adapter");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require("redis");

    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    Logger.info("Socket.IO Redis adapter enabled for multi-instance distributed clustering");
  } catch (error) {
    Logger.warn("Redis adapter configuration failed, falling back to In-Memory adapter:", error);
  }
}

