"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ConversationResponse, MessageResponse, RealtimeTypingPayload } from "@/types";
import { socketClient } from "@/lib/socket-client";

interface ChatWindowProps {
  conversation: ConversationResponse;
  currentUserId?: string;
  token?: string | null;
  onOpenGroupManage?: () => void;
}

export function ChatWindow({
  conversation,
  currentUserId,
  token,
  onOpenGroupManage,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  // Load initial messages and mark conversation as read
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/conversations/${conversation.id}/messages?limit=30`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          // Messages arrive in reverse-chronological order from API, reverse for chat window
          setMessages([...data.data.items].reverse());
          setCursor(data.data.nextCursor);
          setHasMore(data.data.hasMore);
        }

        // Mark as read
        await fetch(`/api/v1/conversations/${conversation.id}/read`, {
          method: "POST",
          headers: getHeaders(),
        });
      } catch {
        // Ignore
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initChat();

    // Socket Room Subscriptions
    socketClient.joinConversation(conversation.id);

    const unsubscribeNewMessage = socketClient.on<MessageResponse>("message:new", (msg) => {
      if (msg.conversationId === conversation.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    const unsubscribeTypingStart = socketClient.on<RealtimeTypingPayload>("typing:start", (payload) => {
      if (payload.conversationId === conversation.id && payload.userId !== currentUserId) {
        setTypingUsers((prev) => new Set(prev).add(payload.username || "Someone"));
      }
    });

    const unsubscribeTypingStop = socketClient.on<RealtimeTypingPayload>("typing:stop", (payload) => {
      if (payload.conversationId === conversation.id) {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(payload.username || "Someone");
          return updated;
        });
      }
    });

    return () => {
      isMounted = false;
      socketClient.leaveConversation(conversation.id);
      unsubscribeNewMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
    };
  }, [conversation.id, getHeaders, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Send typing start event
    socketClient.sendTypingStart(conversation.id);

    // Debounce typing stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketClient.sendTypingStop(conversation.id);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketClient.sendTypingStop(conversation.id);

      const res = await fetch(`/api/v1/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error?.message || "Failed to send message");
      }
    } catch {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!cursor) return;
    try {
      const res = await fetch(
        `/api/v1/conversations/${conversation.id}/messages?limit=30&cursor=${cursor}`,
        { headers: getHeaders() }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const older = [...data.data.items].reverse();
        setMessages((prev) => [...older, ...prev]);
        setCursor(data.data.nextCursor);
        setHasMore(data.data.hasMore);
      }
    } catch {
      // Ignore
    }
  };

  let headerTitle = conversation.name;
  if (!conversation.isGroup && currentUserId) {
    const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
    if (otherMember) {
      headerTitle = otherMember.user.displayName || otherMember.user.username || "User";
    }
  }
  if (!headerTitle) {
    headerTitle = conversation.isGroup ? "Group Chat" : "Direct Message";
  }

  const currentUserRole = conversation.members.find((m) => m.userId === currentUserId)?.role;
  const isGroupAdmin = conversation.isGroup && currentUserRole === "ADMIN";

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <span>{headerTitle}</span>
            {conversation.isGroup && (
              <span className="text-3xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                {conversation.members.length} members
              </span>
            )}
          </h3>
          <span className="text-3xs text-gray-400">
            {conversation.isGroup ? "Group Conversation" : "Direct Messages"}
          </span>
        </div>

        {conversation.isGroup && onOpenGroupManage && (
          <button
            type="button"
            onClick={onOpenGroupManage}
            className="px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
          >
            {isGroupAdmin ? "Manage Group" : "Group Info"}
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {hasMore && (
          <div className="text-center py-2">
            <button
              type="button"
              onClick={loadOlderMessages}
              className="text-xs text-blue-600 hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-xs text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-400">
            No messages in this chat yet. Say hi!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = currentUserId && msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
              >
                {!isSelf && conversation.isGroup && (
                  <span className="text-3xs text-gray-400 mb-1 px-1">
                    {msg.sender.displayName || msg.sender.username}
                  </span>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    isSelf
                      ? "bg-blue-600 text-white rounded-br-xs shadow-2xs"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-xs shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                <span className="text-3xs text-gray-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 italic py-1 px-2">
            <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-2xs">
              {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          maxLength={4000}
          className="flex-1 p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs"
        >
          Send
        </button>
      </form>
    </div>
  );
}

