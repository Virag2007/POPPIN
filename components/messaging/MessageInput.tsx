"use client";

import React, { useState, useRef } from "react";
import { Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { AttachmentPayload } from "@/lib/socket/events";
import { AttachmentPreview } from "./AttachmentPreview";
import { uploadImage } from "@/lib/storage/upload-image";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: AttachmentPayload[]) => Promise<void>;
  onStartTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPayload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value.trim().length > 0) {
      onStartTyping();
    } else {
      onStopTyping();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Enforce format and size
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image formats (JPEG, PNG, WebP, AVIF) are permitted");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Images must be under 10MB");
        }

        // Upload to Cloudinary using secure signed browser upload
        const result = await uploadImage(file, { folder: "posts" });

        return {
          publicId: result.publicId,
          secureUrl: result.secureUrl,
          resourceType: "image",
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        } as AttachmentPayload;
      });

      const uploaded = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || isSending || isUploading || disabled) {
      return;
    }

    setIsSending(true);
    onStopTyping();

    try {
      await onSendMessage(trimmed, attachments.length > 0 ? attachments : undefined);
      setText("");
      setAttachments([]);
      setUploadError(null);
    } catch (err) {
      console.error("[MessageInput] Failed to send message:", err);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Attachment Previews */}
      <AttachmentPreview
        attachments={attachments}
        onRemove={handleRemoveAttachment}
        isUploading={isUploading}
      />

      {/* Error Message */}
      {uploadError && (
        <div className="px-4 py-1 text-xs text-rose-600 bg-rose-50 border-t border-rose-100 font-medium">
          {uploadError}
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachment Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2 text-slate-500 hover:text-poppin-lilac hover:bg-slate-100 rounded-xl transition disabled:opacity-50 shrink-0"
          title="Attach image (Cloudinary)"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-poppin-lilac animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          disabled={disabled}
          rows={1}
          maxLength={5000}
          className="flex-1 max-h-32 min-h-[40px] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac resize-none transition"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={(!text.trim() && attachments.length === 0) || isSending || isUploading || disabled}
          className="p-2.5 bg-poppin-lilac hover:bg-poppin-lilac-hover text-white rounded-xl shadow-xs transition disabled:opacity-40 disabled:hover:bg-poppin-lilac shrink-0"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
