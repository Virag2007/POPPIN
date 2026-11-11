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
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
        isActive
          ? "bg-poppin-lilac-light/80 border border-poppin-lilac-border shadow-2xs"
          : "hover:bg-slate-50 border border-transparent"
      }`}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={title}
          className="w-10 h-10 rounded-2xl object-cover shrink-0 ring-1 ring-slate-200"
        />
      ) : (
        <div className="w-10 h-10 rounded-2xl bg-poppin-lilac-light text-poppin-lilac border border-poppin-lilac-border flex items-center justify-center font-bold text-xs shrink-0 font-mono">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-xs font-heading font-bold text-slate-900 truncate flex items-center gap-1.5">
            <span>{title}</span>
            {conversation.isGroup && (
              <span className="px-1.5 py-0.5 rounded-full bg-poppin-lilac/10 text-poppin-lilac text-[10px] font-semibold">
                Group
              </span>
            )}
          </h4>
          {formattedDate && <span className="text-[10px] text-slate-400 font-mono">{formattedDate}</span>}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 truncate mr-2 leading-relaxed">{lastMessageSnippet}</p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-poppin-lilac text-white shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
