"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";

export function usePresence(conversationId?: string | null) {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, { isTyping: boolean; username?: string }>>(new Map());

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleTypingUpdate = ({
      conversationId: cid,
      userId,
      isTyping,
      username,
    }: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
      username?: string;
    }) => {
      if (conversationId && cid !== conversationId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(userId, { isTyping: true, username });
        } else {
          next.delete(userId);
        }
        return next;
      });
    };

    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.off("typing:update", handleTypingUpdate);
    };
  }, [socket, isConnected, conversationId]);

  const startTyping = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    socket.emit("typing:start", { conversationId });

    // Auto-stop typing after 3.5s of no keystrokes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId });
      typingTimeoutRef.current = null;
    }, 3500);
  }, [socket, isConnected, conversationId]);

  const stopTyping = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socket.emit("typing:stop", { conversationId });
  }, [socket, isConnected, conversationId]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
    typingUsers: Array.from(typingUsers.entries()).map(([userId, val]) => ({
      userId,
      username: val.username,
    })),
    startTyping,
    stopTyping,
  };
}

