"use client";

import React, { useState } from "react";
import { MessageResponseDTO } from "@/lib/socket/events";
import { ReadReceipt } from "./ReadReceipt";

interface MessageBubbleProps {
  message: MessageResponseDTO;
  isSelf: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isSelf, showAvatar = true }: MessageBubbleProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDeleted = !!message.deletedAt;

  return (
    <div className={`flex items-end gap-2 my-1 ${isSelf ? "justify-end" : "justify-start"}`}>
      {/* Sender Avatar for incoming messages */}
      {!isSelf && showAvatar && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
          {message.sender.profile?.avatar ? (
            <img
              src={message.sender.profile.avatar}
              alt={message.sender.profile.username || "Sender"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500 bg-slate-100">
              {(message.sender.profile?.username || "U")[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      {!isSelf && !showAvatar && <div className="w-8 shrink-0" />}

      {/* Bubble Container */}
      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
        {/* Username in group context for incoming */}
        {!isSelf && message.sender.profile?.displayName && (
          <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
            {message.sender.profile.displayName}
          </span>
        )}

        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm transition-all ${
            isSelf
              ? "bg-poppin-lilac text-white rounded-br-xs shadow-xs"
              : "bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs shadow-2xs"
          } ${isDeleted ? "italic opacity-60" : ""}`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`grid gap-1.5 mb-2 ${message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  onClick={() => setSelectedImage(att.secureUrl)}
                  className="rounded-xl overflow-hidden border border-black/10 cursor-pointer hover:opacity-95 transition bg-slate-100"
                >
                  <img
                    src={att.secureUrl}
                    alt="Media Attachment"
                    className="w-full max-h-60 object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}

          {/* Time & Read Receipt Status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-medium ${
              isSelf ? "text-blue-100" : "text-slate-400"
            }`}
          >
            <span>{formattedTime}</span>
            {isSelf && <ReadReceipt status={message.status || "sent"} className={isSelf ? "text-blue-100" : ""} />}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Expanded Attachment" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

