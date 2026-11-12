"use client";

import React from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { AttachmentPayload } from "@/lib/socket/events";

interface AttachmentPreviewProps {
  attachments: AttachmentPayload[];
  onRemove: (index: number) => void;
  isUploading?: boolean;
}

export function AttachmentPreview({
  attachments,
  onRemove,
  isUploading = false,
}: AttachmentPreviewProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border-t border-slate-100 rounded-t-xl">
      {attachments.map((att, idx) => (
        <div
          key={`${att.secureUrl}-${idx}`}
          className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs"
        >
          {att.resourceType === "image" || att.secureUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
            <img
              src={att.secureUrl}
              alt="Attachment"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-500">
              <ImageIcon className="w-6 h-6 text-slate-400" />
              <span className="text-[10px] truncate max-w-full font-medium mt-1">
                {att.format || "File"}
              </span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}

          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 hover:bg-black text-white opacity-90 group-hover:opacity-100 transition shadow-xs"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

