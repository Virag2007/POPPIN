import http from "node:http";
import { env } from "./config/env";
import { Logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { createSocketServer } from "./socket";

async function bootstrap() {
  const server = http.createServer((req, res) => {
    // Health check endpoint for Railway / load balancers
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "poppin-realtime-server",
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          environment: env.NODE_ENV,
        })
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  const io = await createSocketServer(server);

  server.listen(env.PORT, env.HOST, () => {
    Logger.info(`🚀 POPPIN Real-Time Server running on http://${env.HOST}:${env.PORT}`);
    Logger.info(`Health check available at http://${env.HOST}:${env.PORT}/health`);
    Logger.info(`Allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    Logger.info(`Received ${signal}. Shutting down gracefully...`);

    // 1. Close HTTP server and socket connections
    io.close(() => {
      Logger.info("Socket.IO server closed.");
    });

    server.close(async () => {
      Logger.info("HTTP server closed.");

      // 2. Disconnect database client
      try {
        await prisma.$disconnect();
        Logger.info("Prisma client disconnected.");
      } catch (err) {
        Logger.error("Error disconnecting Prisma:", err);
      }

      process.exit(0);
    });

    // Force exit after 10 seconds if hanging
    setTimeout(() => {
      Logger.error("Forcefully terminating process after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  Logger.error("Failed to start realtime server:", err);
  process.exit(1);
});

