"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
import { MessageResponseDTO, AttachmentPayload } from "@/lib/socket/events";
import { useAuth } from "@/context/AuthContext";

export function useMessages(conversationId: string | null) {
  const { socket, isConnected } = useSocket();
  const { user, profile } = useAuth();

  const [messages, setMessages] = useState<MessageResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Initial load via REST API
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages?limit=30`);
      const data = await res.json();
      if (res.ok && data.success) {
        // Reverse array so messages are in chronological order (oldest -> newest)
        const items = [...data.data.items].reverse();
        setMessages(items);
        setNextCursor(data.data.nextCursor);
        setHasMore(data.data.hasMore);
      }
    } catch (err) {
      console.error("[useMessages] Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Load older messages for infinite scroll
  const loadMore = useCallback(async () => {
    if (!conversationId || !nextCursor || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const res = await fetch(
        `/api/v1/conversations/${conversationId}/messages?limit=30&cursor=${nextCursor}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const olderItems = [...data.data.items].reverse();
        setMessages((prev) => [...olderItems, ...prev]);
        setNextCursor(data.data.nextCursor);
        setHasMore(data.data.hasMore);
      }
    } catch (err) {
      console.error("[useMessages] Failed to load more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, nextCursor, isLoadingMore, hasMore]);

  // Real-time Socket Event Listeners
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Handler: message:new
    const handleNewMessage = (newMsg: MessageResponseDTO) => {
      if (newMsg.conversationId !== conversationIdRef.current) return;

      setMessages((prev) => {
        // If message already exists by id, do not add duplicate
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }

        // Check if this fulfills an optimistic message with matching clientMessageId
        if (newMsg.clientMessageId) {
          const optIdx = prev.findIndex((m) => m.clientMessageId === newMsg.clientMessageId);
          if (optIdx !== -1) {
            const updated = [...prev];
            updated[optIdx] = { ...newMsg, status: "sent" };
            return updated;
          }
        }

        return [...prev, { ...newMsg, status: "sent" }];
      });
    };

    // Handler: message:deleted
    const handleDeletedMessage = ({ messageId, conversationId: cid }: { messageId: string; conversationId: string }) => {
      if (cid !== conversationIdRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: "This message was deleted", deletedAt: new Date().toISOString() }
            : m
        )
      );
    };

    // Handler: message:read
    const handleMessageRead = ({ messageId, conversationId: cid }: { messageId: string; conversationId: string }) => {
      if (cid !== conversationIdRef.current) return;
      // You can update read indicators if tracking individual receipts
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("message:read", handleMessageRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("message:read", handleMessageRead);
    };
  }, [socket, isConnected, conversationId]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (content: string, attachments?: AttachmentPayload[]) => {
      if (!conversationId || !user) return;

      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 1. Create Optimistic Message
      const optimisticMessage: MessageResponseDTO = {
        id: clientMessageId,
        conversationId,
        senderId: user.id,
        clientMessageId,
        content: content.trim(),
        type: attachments && attachments.length > 0 ? "IMAGE" : "TEXT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
        sender: {
          id: user.id,
          profile: profile
            ? {
                username: profile.username || "You",
                displayName: profile.displayName || "You",
                avatar: profile.avatar || null,
              }
            : null,
        },
        attachments: (attachments || []).map((att, idx) => ({
          id: `opt_att_${idx}`,
          secureUrl: att.secureUrl,
          resourceType: att.resourceType || "image",
          format: att.format,
          width: att.width,
          height: att.height,
          bytes: att.bytes,
        })),
      };

      // Add to local state immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // 2. Transmit via Socket.IO with fallback to REST
      if (socket && isConnected) {
        socket.emit(
          "message:send",
          {
            conversationId,
            clientMessageId,
            content: content.trim(),
            type: optimisticMessage.type as any,
            attachments,
          },
          (res) => {
            if (res?.success && res.data) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.clientMessageId === clientMessageId
                    ? { ...res.data!, status: "sent" }
                    : m
                )
              );
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.clientMessageId === clientMessageId
                    ? { ...m, status: "failed" }
                    : m
                )
              );
            }
          }
        );
      } else {
        // HTTP REST fallback when socket is disconnected
        try {
          const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: content.trim(),
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setMessages((prev) =>
              prev.map((m) =>
                m.clientMessageId === clientMessageId
                  ? { ...data.data, status: "sent" }
                  : m
              )
            );
          } else {
            throw new Error(data?.error?.message || "Failed to send");
          }
        } catch {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMessageId === clientMessageId
                ? { ...m, status: "failed" }
                : m
            )
          );
        }
      }
    },
    [conversationId, user, profile, socket, isConnected]
  );

  // Mark message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!conversationId || !messageId) return;

      if (socket && isConnected) {
        socket.emit("message:read", { conversationId, messageId });
      }
      // Also update backend marker via REST
      fetch(`/api/v1/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
    },
    [conversationId, socket, isConnected]
  );

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    sendMessage,
    markAsRead,
  };
}
