// POPPIN Server-Side Real-time Broadcaster
// Dispatches real-time events to room listeners and socket clients

import { EventEmitter } from "node:events";
import { RealtimeServerEvent } from "@/types";
import { socketClient } from "@/lib/socket-client";

class RealtimeBroadcaster extends EventEmitter {
  broadcastToRoom<T>(room: string, event: RealtimeServerEvent, payload: T): void {
    this.emit(`room:${room}`, { event, payload });

    // Also deliver to local socketClient simulation in dev/test
    socketClient._dispatchServerEvent(event, payload);

    // Forward to WebSocket server on port 3001 if active
    if (typeof fetch !== "undefined") {
      fetch("http://localhost:3001/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, event, payload }),
      }).catch(() => {
        // Silently continue if standalone ws server is not active
      });
    }
  }

  broadcastToUser<T>(userId: string, event: RealtimeServerEvent, payload: T): void {
    this.emit(`user:${userId}`, { event, payload });
    socketClient._dispatchServerEvent(event, payload);
  }
}

export const realtimeBroadcaster = new RealtimeBroadcaster();
