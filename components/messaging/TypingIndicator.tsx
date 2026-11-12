"use client";

import React from "react";

interface TypingIndicatorProps {
  typingUsers: { userId: string; username?: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].username || "Someone"} is typing...`
      : `${typingUsers.length} people are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 bg-slate-50/80 border-t border-slate-100 animate-fadeIn">
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-poppin-lilac animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-poppin-lilac animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-poppin-lilac animate-bounce" />
      </div>
      <span className="font-medium italic">{text}</span>
    </div>
  );
}

