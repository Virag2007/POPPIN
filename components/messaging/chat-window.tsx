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
import { Users, Settings, Loader2 } from "lucide-react";

interface ChatWindowProps {
  conversation: ConversationResponse;
  currentUserId?: string;
  token?: string | null;
  onOpenGroupManage?: () => void;
}

export function ChatWindow({
  conversation,
  currentUserId = "",
  onOpenGroupManage,
}: ChatWindowProps) {
  // 1. Socket.IO Room Lifecycle
  const { joinError } = useConversation(conversation.id);

  // 2. Messages & Optimistic Transmission
  const { messages, isLoading, isLoadingMore, hasMore, loadMore, sendMessage } =
    useMessages(conversation.id);

  // 3. Online Presence & Typing State
  const { isUserOnline, typingUsers, startTyping, stopTyping } =
    usePresence(conversation.id);

  // Find other partner for 1-on-1 direct conversations
  const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
  const displayName = conversation.isGroup
    ? conversation.name || "Group Discussion"
    : otherMember?.user.displayName || otherMember?.user.username || "Direct Chat";
  const avatar = conversation.isGroup ? conversation.avatar : otherMember?.user.avatar;
  const isPartnerOnline = !conversation.isGroup && otherMember ? isUserOnline(otherMember.userId) : false;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-200">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500 bg-slate-100">
                  {conversation.isGroup ? <Users className="w-4 h-4 text-slate-400" /> : displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {!conversation.isGroup && (
              <div className="absolute -bottom-0.5 -right-0.5">
                <OnlineIndicator isOnline={isPartnerOnline} size="sm" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{displayName}</h2>
              {conversation.isGroup && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {conversation.members.length} members
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {conversation.isGroup
                ? `${conversation.members.length} participants in room`
                : isPartnerOnline
                ? "Active now"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {conversation.isGroup && onOpenGroupManage && (
            <button
              type="button"
              onClick={onOpenGroupManage}
              className="p-2 text-slate-500 hover:text-poppin-lilac hover:bg-slate-100 rounded-xl transition"
              title="Manage group"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Join Error Banner */}
      {joinError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-semibold text-amber-800">
          ⚠️ {joinError}
        </div>
      )}

      {/* Messages Scroll Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-poppin-lilac animate-spin" />
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
