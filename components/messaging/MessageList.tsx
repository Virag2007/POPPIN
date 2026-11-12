"use client";

import React, { useEffect, useRef } from "react";
import { MessageResponseDTO } from "@/lib/socket/events";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: MessageResponseDTO[];
  currentUserId: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function MessageList({
  messages,
  currentUserId,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          💬
        </div>
        <p className="text-sm font-semibold text-slate-600">No messages yet</p>
        <p className="text-xs text-slate-400 mt-1">Send a message below to start the conversation.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
      {/* Load More Button for Pagination */}
      {hasMore && (
        <div className="text-center py-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-poppin-lilac bg-poppin-lilac-light hover:bg-poppin-lilac/20 transition disabled:opacity-50"
          >
            {isLoadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Load older messages</span>
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, index) => {
        const isSelf = msg.senderId === currentUserId;
        const prevMsg = messages[index - 1];
        const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

        return (
          <MessageBubble
            key={msg.id || msg.clientMessageId}
            message={msg}
            isSelf={isSelf}
            showAvatar={showAvatar}
          />
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

