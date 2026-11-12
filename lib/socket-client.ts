// POPPIN Typed Real-time Socket Client Abstraction
// Handles real-time messaging, typing indicators, and in-app notifications
// Uses WebSockets with native BroadcastChannel cross-tab synchronization fallback

import { RealtimeClientEvent, RealtimeServerEvent, RealtimeTypingPayload } from "@/types";

export type SocketEventHandler<T = unknown> = (data: T) => void;

export class PoppinSocketClient {
  private url: string;
  private token?: string | null;
  private listeners: Map<string, Set<SocketEventHandler<unknown>>> = new Map();
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected = false;
  private activeRooms: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url?: string) {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      this.url = url || process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${window.location.hostname}:3001`;
      this.initBroadcastChannel();
      this.connect();
    } else {
      this.url = url || "ws://localhost:3001";
    }
  }

  private initBroadcastChannel() {
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        this.broadcastChannel = new BroadcastChannel("poppin_realtime_events");
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type && event.data.payload) {
            this._dispatchServerEvent(event.data.type, event.data.payload);
          }
        };
      } catch (e) {
        console.warn("[Realtime] BroadcastChannel not available:", e);
      }
    }
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  getAuthToken(): string | null | undefined {
    return this.token;
  }

  getUrl(): string {
    return this.url;
  }

  connect(): void {
    if (typeof window === "undefined") {
      this.isConnected = true;
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Re-join active rooms
        for (const roomId of this.activeRooms) {
          this.emit("conversation:join", { conversationId: roomId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event && parsed.payload) {
            this._dispatchServerEvent(parsed.event, parsed.payload);
          }
        } catch {
          // Ignore unparseable frames
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Reconnection backoff
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        // Fallback to internal/BroadcastChannel dispatching
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.listeners.clear();
  }

  on<T = unknown>(event: RealtimeServerEvent, handler: SocketEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const typedHandler = handler as SocketEventHandler<unknown>;
    this.listeners.get(event)!.add(typedHandler);

    return () => {
      this.listeners.get(event)?.delete(typedHandler);
    };
  }

  emit(event: RealtimeClientEvent, payload: unknown): void {
    // 1. Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ event, payload }));
      } catch (err) {
        console.warn("[WebSocket] send error:", err);
      }
    }

    // 2. Broadcast cross-tab so all open windows get immediate sync
    if (this.broadcastChannel) {
      try {
        // Map client typing events to server events for immediate peer delivery
        if (event === "typing:start" || event === "typing:stop") {
          this.broadcastChannel.postMessage({ type: event, payload });
        }
      } catch {}
    }
  }

  // Helper dispatcher used for testing, web sockets, and in-process simulation
  _dispatchServerEvent<T>(event: RealtimeServerEvent, payload: T): void {
    // Deliver to registered listeners
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error("[Realtime] Handler error:", e);
        }
      });
    }

    // Sync across browser tabs via BroadcastChannel
    if (this.broadcastChannel && typeof window !== "undefined") {
      try {
        this.broadcastChannel.postMessage({ type: event, payload });
      } catch {}
    }
  }

  joinConversation(conversationId: string): void {
    this.activeRooms.add(conversationId);
    this.emit("conversation:join", { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.activeRooms.delete(conversationId);
    this.emit("conversation:leave", { conversationId });
  }

  sendTypingStart(conversationId: string, username?: string, userId?: string): void {
    const payload: RealtimeTypingPayload = { conversationId, userId: userId || "", username };
    this.emit("typing:start", payload);
  }

  sendTypingStop(conversationId: string, username?: string, userId?: string): void {
    const payload: RealtimeTypingPayload = { conversationId, userId: userId || "", username };
    this.emit("typing:stop", payload);
  }
}

export const socketClient = new PoppinSocketClient();
