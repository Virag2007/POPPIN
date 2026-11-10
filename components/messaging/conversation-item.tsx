"use client";

import React from "react";
import Link from "next/link";
import { ConversationResponse } from "@/types";

interface ConversationItemProps {
  conversation: ConversationResponse;
  currentUserId?: string;
  isActive?: boolean;
}

export function ConversationItem({
  conversation,
  currentUserId,
  isActive = false,
}: ConversationItemProps) {
  // Determine title and avatar
  let title = conversation.name;
  let avatar = conversation.avatar;

  if (!conversation.isGroup && currentUserId) {
    const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
    if (otherMember) {
      title = otherMember.user.displayName || otherMember.user.username || "User";
      avatar = otherMember.user.avatar || null;
    }
  }

  if (!title) {
    title = conversation.isGroup ? "Group Chat" : "Direct Message";
  }

  const initials = title.slice(0, 2).toUpperCase();
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
    <Link
      href={`/messages/${conversation.id}`}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        isActive
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-gray-50 border border-transparent"
      }`}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={title}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
        />
      ) : (
        <div
          className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 ${
            conversation.isGroup ? "bg-purple-600" : "bg-blue-600"
          }`}
        >
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1.5">
            <span>{title}</span>
            {conversation.isGroup && (
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-3xs font-medium">
                Group
              </span>
            )}
          </h4>
          {formattedDate && <span className="text-3xs text-gray-400">{formattedDate}</span>}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-2xs text-gray-500 truncate mr-2">{lastMessageSnippet}</p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-3xs font-bold bg-blue-600 text-white shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

