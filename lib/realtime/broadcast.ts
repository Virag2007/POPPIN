// POPPIN Server-Side Real-time Broadcaster
// Dispatches real-time events to room listeners and socket clients

import { EventEmitter } from "node:events";
import { RealtimeServerEvent } from "@/types";
import { socketClient } from "@/lib/socket-client";

class RealtimeBroadcaster extends EventEmitter {
  broadcastToRoom<T>(room: string, event: RealtimeServerEvent, payload: T): void {
    this.emit(`room:${room}`, { event, payload });

    // Also deliver to local socketClient simulation in dev/test
    try {
      socketClient._dispatchServerEvent(event, payload);
    } catch {
      // Ignore
    }

    // Forward to WebSocket server on port 4000 if active (non-blocking with 150ms timeout)
    if (typeof fetch !== "undefined") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 150);
        const url = process.env.INTERNAL_SOCKET_URL || "http://127.0.0.1:4000/broadcast";

        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, event, payload }),
          signal: controller.signal,
        })
          .catch(() => {
            // Silently continue if standalone ws server is not active
          })
          .finally(() => {
            clearTimeout(timeoutId);
          });
      } catch {
        // Silently continue
      }
    }
  }

  broadcastToUser<T>(userId: string, event: RealtimeServerEvent, payload: T): void {
    this.emit(`user:${userId}`, { event, payload });
    try {
      socketClient._dispatchServerEvent(event, payload);
    } catch {
      // Ignore
    }

    if (typeof fetch !== "undefined") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 150);
        const url = process.env.INTERNAL_SOCKET_URL || "http://127.0.0.1:4000/broadcast";

        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: `user:${userId}`, event, payload }),
          signal: controller.signal,
        })
          .catch(() => {})
          .finally(() => {
            clearTimeout(timeoutId);
          });
      } catch {
        // Silently continue
      }
    }
  }
}

export const realtimeBroadcaster = new RealtimeBroadcaster();
