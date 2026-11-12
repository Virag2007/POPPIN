import { Logger } from "../lib/logger";

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  activeSockets: number;
}

export interface PresenceStore {
  addSocket(userId: string, socketId: string): Promise<{ isFirstSocket: boolean; total: number }>;
  removeSocket(userId: string, socketId: string): Promise<{ isLastSocket: boolean; total: number; lastSeen: Date }>;
  isUserOnline(userId: string): Promise<boolean>;
  getOnlineUsers(): Promise<string[]>;
  getUserPresence(userId: string): Promise<UserPresence>;
}

export class InMemoryPresenceStore implements PresenceStore {
  // Map of userId -> Set of socketIds
  private userSockets: Map<string, Set<string>> = new Map();
  // Map of userId -> lastSeen Date
  private lastSeenMap: Map<string, Date> = new Map();

  async addSocket(userId: string, socketId: string) {
    let sockets = this.userSockets.get(userId);
    const isFirstSocket = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);
    this.lastSeenMap.set(userId, new Date());

    return {
      isFirstSocket,
      total: sockets.size,
    };
  }

  async removeSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    const lastSeen = new Date();
    this.lastSeenMap.set(userId, lastSeen);

    if (!sockets) {
      return { isLastSocket: true, total: 0, lastSeen };
    }

    sockets.delete(socketId);
    const isLastSocket = sockets.size === 0;

    if (isLastSocket) {
      this.userSockets.delete(userId);
    }

    return {
      isLastSocket,
      total: sockets.size,
      lastSeen,
    };
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const sockets = this.userSockets.get(userId);
    return !!(sockets && sockets.size > 0);
  }

  async getOnlineUsers(): Promise<string[]> {
    return Array.from(this.userSockets.keys());
  }

  async getUserPresence(userId: string): Promise<UserPresence> {
    const sockets = this.userSockets.get(userId);
    const isOnline = !!(sockets && sockets.size > 0);
    const lastSeen = this.lastSeenMap.get(userId) || new Date();

    return {
      userId,
      isOnline,
      lastSeen,
      activeSockets: sockets ? sockets.size : 0,
    };
  }
}

export class TypingIndicatorManager {
  // Map of key `${conversationId}:${userId}` -> NodeJS.Timeout
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_EXPIRY_MS = 4000;

  startTyping(
    conversationId: string,
    userId: string,
    onExpire: () => void,
    expiryMs = this.DEFAULT_EXPIRY_MS
  ): boolean {
    const key = `${conversationId}:${userId}`;
    const existing = this.typingTimeouts.get(key);
    const isNew = !existing;

    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.typingTimeouts.delete(key);
      try {
        onExpire();
      } catch (err) {
        Logger.error("Error executing typing expiration callback:", err);
      }
    }, expiryMs);

    this.typingTimeouts.set(key, timer);
    return isNew;
  }

  stopTyping(conversationId: string, userId: string): boolean {
    const key = `${conversationId}:${userId}`;
    const existing = this.typingTimeouts.get(key);
    if (existing) {
      clearTimeout(existing);
      this.typingTimeouts.delete(key);
      return true;
    }
    return false;
  }

  clearUserTyping(userId: string) {
    for (const [key, timer] of this.typingTimeouts.entries()) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(timer);
        this.typingTimeouts.delete(key);
      }
    }
  }
}

// Global Singletons
export const presenceStore: PresenceStore = new InMemoryPresenceStore();
export const typingManager = new TypingIndicatorManager();

