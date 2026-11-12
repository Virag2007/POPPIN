"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import { MessageResponseDTO } from "@/lib/socket/events";

export function useConversation(conversationId: string | null) {
  const { socket, isConnected } = useSocket();
  const [isJoined, setIsJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const join = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    socket.emit("conversation:join", { conversationId }, (res) => {
      if (res?.success) {
        setIsJoined(true);
        setJoinError(null);
      } else {
        setIsJoined(false);
        setJoinError(res?.error?.message || "Failed to join conversation");
      }
    });
  }, [socket, isConnected, conversationId]);

  const leave = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    socket.emit("conversation:leave", { conversationId });
    setIsJoined(false);
  }, [socket, isConnected, conversationId]);

  useEffect(() => {
    if (!conversationId || !socket || !isConnected) {
      setIsJoined(false);
      return;
    }

    join();

    return () => {
      leave();
    };
  }, [conversationId, socket, isConnected, join, leave]);

  return {
    isJoined,
    joinError,
    rejoin: join,
  };
}

