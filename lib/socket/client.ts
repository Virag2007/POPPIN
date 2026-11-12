"use client";

import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./events";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketClientManager {
  private static instance: SocketClientManager;
  private socket: TypedSocket | null = null;
  private currentToken: string | null = null;
  private connectionPromise: Promise<TypedSocket> | null = null;

  private constructor() {}

  static getInstance(): SocketClientManager {
    if (!SocketClientManager.instance) {
      SocketClientManager.instance = new SocketClientManager();
    }
    return SocketClientManager.instance;
  }

  getSocket(token?: string | null): TypedSocket {
    if (typeof window === "undefined") {
      // Mock or dummy socket for SSR environments
      return {} as TypedSocket;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:4000"
        : `${window.location.protocol}//${window.location.host}`);

    // If socket already exists with the same token, return it
    if (this.socket && this.currentToken === token) {
      return this.socket;
    }

    // If token changed or socket disconnected, recreate or update auth
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentToken = token || null;

    this.socket = io(socketUrl, {
      auth: { token: this.currentToken },
      transports: ["websocket", "polling"],
      autoConnect: !!this.currentToken,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Socket] Connected to ${socketUrl} (id: ${this.socket?.id})`);
      }
    });

    this.socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Socket] Disconnected: ${reason}`);
      }
    });

    this.socket.on("connect_error", (error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Socket] Connection error:", error.message);
      }
    });

    return this.socket;
  }

  updateToken(token: string | null) {
    if (this.currentToken === token) return;
    this.currentToken = token;
    if (this.socket) {
      this.socket.auth = { token };
      if (token && !this.socket.connected) {
        this.socket.connect();
      } else if (!token && this.socket.connected) {
        this.socket.disconnect();
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentToken = null;
  }
}

export const socketManager = SocketClientManager.getInstance();

