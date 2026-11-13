"use client";

import React from "react";
import { ConversationResponse } from "@/types";
import { AvatarImage } from "@/components/ui/avatar-image";
import { useAuth } from "@/context/AuthContext";

interface ConversationItemProps {
  conversation: ConversationResponse;
  currentUserId?: string;
  isActive?: boolean;
  isOnline?: boolean;
}

export function ConversationItem({
  conversation,
  currentUserId: propUserId,
  isActive = false,
  isOnline = false,
}: ConversationItemProps) {
  const { user } = useAuth();
  const currentUserId = propUserId || user?.id;

  let displayName = conversation.name;
  let username: string | null = null;
  let avatar = conversation.avatar;
  let isDeleted = false;

  if (!conversation.isGroup) {
    // Reliably resolve the OTHER participant, never falling back to current user
    const otherMember = currentUserId
      ? conversation.members.find((m) => m.userId !== currentUserId)
      : conversation.members.find((m) => m.userId !== user?.id) || conversation.members[0];

    if (otherMember?.user) {
      const rawDisplay = otherMember.user.displayName?.trim();
      const rawUser = otherMember.user.username?.trim();

      displayName = rawDisplay || rawUser || "Member";
      username = rawUser ?? null;
      avatar = otherMember.user.avatar ?? null;
    } else {
      displayName = "Deleted Account";
      username = "deleted";
      avatar = null;
      isDeleted = true;
    }
  }

  if (!displayName) {
    displayName = conversation.isGroup ? "Group Chat" : "Direct Message";
  }

  // Prevent name from appearing twice if displayName and username are identical
  const showUsername = Boolean(
    username &&
      displayName &&
      displayName.toLowerCase() !== username.toLowerCase() &&
      !displayName.toLowerCase().startsWith(`@${username.toLowerCase()}`)
  );

  const lastMessageSnippet = conversation.lastMessage
    ? conversation.lastMessage.content
    : "No messages yet";

  const formattedDate = conversation.lastMessage
    ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
        isActive
          ? "bg-[#383A40] text-white"
          : "hover:bg-[#2B2D31] text-[#B5BAC1]"
      }`}
    >
      <div className="relative shrink-0">
        <AvatarImage
          src={avatar}
          alt={displayName}
          size="md"
          className={isDeleted ? "opacity-50 grayscale" : ""}
        />
        {isOnline && !conversation.isGroup && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#2B2D31]"
            title="Online"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-xs font-heading font-bold text-white truncate">
              {displayName}
            </h4>
            {showUsername && (
              <span className="text-[10px] text-[#B5BAC1] font-mono truncate">
                @{username}
              </span>
            )}
            {conversation.isGroup && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#5865F2]/20 text-[#8A9BFF] text-[9px] font-semibold shrink-0">
                Group
              </span>
            )}
          </div>
          {formattedDate && (
            <span className="text-[10px] text-[#B5BAC1]/70 font-mono shrink-0 ml-2">
              {formattedDate}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#B5BAC1] truncate mr-2 leading-relaxed">
            {lastMessageSnippet}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-[#5865F2] text-white shrink-0 shadow-sm">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
