/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { ConversationResponse } from "@/types";
import { useConversation } from "@/hooks/useConversation";
import { useMessages } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { OnlineIndicator } from "./OnlineIndicator";
import { ArrowLeft, Loader2, User } from "lucide-react";

interface ChatWindowProps {
  conversation: ConversationResponse;
  currentUserId?: string;
  token?: string | null;
  onBack?: () => void;
}

export function ChatWindow({
  conversation,
  currentUserId = "",
  onBack,
}: ChatWindowProps) {
  // 1. Socket.IO Room Lifecycle
  const { joinError } = useConversation(conversation.id);

  // 2. Messages & Optimistic Transmission
  const { messages, isLoading, isLoadingMore, hasMore, loadMore, sendMessage } =
    useMessages(conversation.id);

  // 3. Online Presence & Typing State
  const { isUserOnline, typingUsers, startTyping, stopTyping } =
    usePresence(conversation.id);

  // Find partner for 1-on-1 direct conversation
  const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
  const displayName = otherMember?.user.displayName || otherMember?.user.username || "Direct Message";
  const username = otherMember?.user.username || "user";
  const avatar = otherMember?.user.avatar;
  const isPartnerOnline = otherMember ? isUserOnline(otherMember.userId) : false;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] text-[#F2F3F5]">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-[#2B2D31] border-b border-white/10 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-[#383A40] transition"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#383A40] border border-white/10">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white bg-[#383A40] font-heading">
                  {displayName[0]?.toUpperCase() || <User className="w-4 h-4 text-zinc-400" />}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator isOnline={isPartnerOnline} size="sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-heading">{displayName}</h2>
              <span className="text-xs text-zinc-400 font-mono">@{username}</span>
            </div>
            <p className="text-[11px] text-[#B5BAC1] font-medium font-sans">
              {isPartnerOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Join Error Banner */}
      {joinError && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300">
          ⚠️ {joinError}
        </div>
      )}

      {/* Messages Scroll Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#5865F2] animate-spin" />
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Typing Indicators */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input Composer (Integrated with Cloudinary signed uploads) */}
      <MessageInput
        onSendMessage={sendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
      />
    </div>
  );
}
