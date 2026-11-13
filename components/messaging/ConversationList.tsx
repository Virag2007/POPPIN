/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { ConversationResponse } from "@/types";
import { OnlineIndicator } from "./OnlineIndicator";
import { AvatarImage } from "@/components/ui/avatar-image";

interface ConversationListProps {
  conversations: ConversationResponse[];
  selectedId?: string | null;
  onSelect: (conv: ConversationResponse) => void;
  currentUserId?: string;
  onlineUserIds?: Set<string>;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  onlineUserIds = new Set(),
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        No conversations found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const otherMember = conv.members.find((m) => m.userId !== currentUserId);
        const displayName = conv.isGroup
          ? conv.name || "Group Chat"
          : otherMember?.user.displayName || otherMember?.user.username || "User";
        const avatar = conv.isGroup ? conv.avatar : otherMember?.user.avatar;
        const isPartnerOnline = !conv.isGroup && otherMember ? onlineUserIds.has(otherMember.userId) : false;

        const lastMessage = conv.lastMessage;
        const formattedDate = lastMessage
          ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "";

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv)}
            className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${
              isSelected
                ? "bg-[#383A40] text-white"
                : "text-[#B5BAC1] hover:bg-[#2B2D31] hover:text-white"
            }`}
          >
            {/* Avatar with Online Badge */}
            <div className="relative shrink-0">
              <AvatarImage
                src={avatar}
                alt={displayName}
                size="md"
              />
              {!conv.isGroup && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineIndicator isOnline={isPartnerOnline} size="sm" />
                </div>
              )}
            </div>

            {/* Conversation Metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? "text-poppin-navy font-bold" : "text-slate-800"}`}>
                  {displayName}
                </span>
                {formattedDate && (
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">{formattedDate}</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 truncate max-w-[180px]">
                  {lastMessage ? lastMessage.content : "No messages yet"}
                </p>

                {conv.unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-poppin-lilac text-white text-[10px] font-bold shrink-0 shadow-2xs">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
