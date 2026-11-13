"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
import { MessageResponseDTO, AttachmentPayload } from "@/lib/socket/events";
import { useAuth } from "@/context/AuthContext";

export function useMessages(conversationId: string | null) {
  const { socket, isConnected } = useSocket();
  const { user, profile, token } = useAuth();

  const [messages, setMessages] = useState<MessageResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const lastTimestampRef = useRef<string>("");

  // Initial load via REST API
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      lastTimestampRef.current = "";
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages?limit=30`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Reverse array so messages are in chronological order (oldest -> newest)
        const items = [...data.data.items].reverse();
        setMessages(items);
        setNextCursor(data.data.nextCursor);
        setHasMore(data.data.hasMore);

        if (items.length > 0) {
          lastTimestampRef.current = items[items.length - 1].createdAt;
        } else {
          lastTimestampRef.current = new Date(0).toISOString();
        }
      }
    } catch (err) {
      console.error("[useMessages] Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Load older messages for infinite scroll
  const loadMore = useCallback(async () => {
    if (!conversationId || !nextCursor || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const res = await fetch(
        `/api/v1/conversations/${conversationId}/messages?limit=30&cursor=${nextCursor}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
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
  }, [conversationId, nextCursor, isLoadingMore, hasMore, token]);

  // Real-time Socket Event Listeners
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Handler: message:new
    const handleNewMessage = (newMsg: MessageResponseDTO) => {
      if (newMsg.conversationId !== conversationIdRef.current) return;

      lastTimestampRef.current = newMsg.createdAt;

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

  // Adaptive Real-Time Sync Polling Loop (Seamless real-time message arrival even if WS is inactive)
  useEffect(() => {
    if (!conversationId) return;

    let isDisposed = false;

    const syncNewMessages = async () => {
      if (isDisposed || !conversationIdRef.current) return;

      try {
        const since = lastTimestampRef.current || "";
        const url = `/api/v1/conversations/${conversationIdRef.current}/sync${
          since ? `?since=${encodeURIComponent(since)}` : ""
        }`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) return;
        const data = await res.json();

        if (data.success && Array.isArray(data.data?.messages) && data.data.messages.length > 0) {
          const incoming: MessageResponseDTO[] = data.data.messages;

          setMessages((prev) => {
            const updated = [...prev];
            let modified = false;

            for (const msg of incoming) {
              const matchIdx = updated.findIndex(
                (m) =>
                  m.id === msg.id ||
                  (msg.clientMessageId && m.clientMessageId === msg.clientMessageId)
              );

              if (matchIdx !== -1) {
                if (updated[matchIdx].status !== "sent" || updated[matchIdx].id !== msg.id) {
                  updated[matchIdx] = { ...msg, status: "sent" };
                  modified = true;
                }
              } else {
                updated.push({ ...msg, status: "sent" });
                modified = true;
              }
            }

            return modified ? updated : prev;
          });

          if (data.data.latestTimestamp) {
            lastTimestampRef.current = data.data.latestTimestamp;
          }
        }
      } catch {
        // Silently continue polling
      }
    };

    // Auto-sync every 1.5 seconds for instant updates
    const timer = setInterval(syncNewMessages, 1500);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncNewMessages();
      }
    };
    window.addEventListener("focus", syncNewMessages);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isDisposed = true;
      clearInterval(timer);
      window.removeEventListener("focus", syncNewMessages);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [conversationId, token]);

  // Send message with instantaneous optimistic update and zero perceptible latency
  const sendMessage = useCallback(
    async (content: string, attachments?: AttachmentPayload[]) => {
      if (!conversationId || !user) return;

      const trimmedContent = content.trim();
      if (!trimmedContent && (!attachments || attachments.length === 0)) return;

      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 1. Instantaneous Local Optimistic Bubble
      const optimisticMessage: MessageResponseDTO = {
        id: clientMessageId,
        conversationId,
        senderId: user.id,
        clientMessageId,
        content: trimmedContent,
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

      // Add to messages immediately
      setMessages((prev) => [...prev, optimisticMessage]);
      lastTimestampRef.current = optimisticMessage.createdAt;

      // 2. Transmit via Socket.IO if connected, otherwise via fast REST fallback
      if (socket && isConnected) {
        socket.emit(
          "message:send",
          {
            conversationId,
            clientMessageId,
            content: trimmedContent,
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
              lastTimestampRef.current = res.data.createdAt;
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
        // Fast REST fallback with proper Authorization header
        try {
          const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              content: trimmedContent,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.data) {
            setMessages((prev) =>
              prev.map((m) =>
                m.clientMessageId === clientMessageId
                  ? { ...data.data, status: "sent" }
                  : m
              )
            );
            lastTimestampRef.current = data.data.createdAt;
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
    [conversationId, user, profile, socket, isConnected, token]
  );

  // Mark message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!conversationId || !messageId) return;

      if (socket && isConnected) {
        socket.emit("message:read", { conversationId, messageId });
      }
      // Also update backend marker via REST
      fetch(`/api/v1/conversations/${conversationId}/read`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    },
    [conversationId, socket, isConnected, token]
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
