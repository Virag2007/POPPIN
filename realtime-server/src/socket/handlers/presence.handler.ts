import { Server } from "socket.io";
import { AppSocket } from "../../types/socket";
import { presenceStore, typingManager } from "../../services/presence.service";
import { Logger } from "../../lib/logger";

export async function handleUserConnect(io: Server, socket: AppSocket) {
  const userId = socket.data.user.id;

  // 1. Join dedicated user room for targeted notifications/events across all user devices
  await socket.join(`user:${userId}`);

  // 2. Track connection in PresenceStore
  const { isFirstSocket, total } = await presenceStore.addSocket(userId, socket.id);
  Logger.info(`[Presence] User ${userId} connected (socket: ${socket.id}, active sockets: ${total})`);

  // 3. Broadcast online status if this is the user's first active connection
  if (isFirstSocket) {
    io.emit("user:online", {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Register heartbeat handler
  socket.on("heartbeat", (callback) => {
    callback?.({ timestamp: Date.now() });
  });

  // 5. Handle disconnection
  socket.on("disconnect", async (reason) => {
    Logger.info(`[Presence] Socket ${socket.id} disconnected (user: ${userId}, reason: ${reason})`);

    const { isLastSocket, total: remaining, lastSeen } = await presenceStore.removeSocket(userId, socket.id);

    // If no more active sockets for this user across tabs/devices, mark user offline
    if (isLastSocket) {
      typingManager.clearUserTyping(userId);
      io.emit("user:offline", {
        userId,
        lastSeen: lastSeen.toISOString(),
      });
      Logger.info(`[Presence] User ${userId} is now offline (all sockets closed)`);
    } else {
      Logger.debug(`[Presence] User ${userId} still online on ${remaining} other socket(s)`);
    }
  });
}

