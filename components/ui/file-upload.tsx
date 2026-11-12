/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

interface UploadedFile {
  url: string;
  key?: string;
  mimeType?: string;
  size?: number;
}

interface FileUploadProps {
  onUploadSuccess: (file: UploadedFile) => void;
  onRemove?: () => void;
  currentValue?: string | null;
  label?: string;
  maxSizeBytes?: number; // default 10MB
  accept?: string;
  className?: string;
}

export function FileUpload({
  onUploadSuccess,
  onRemove,
  currentValue,
  label = "Upload Image",
  maxSizeBytes = 10 * 1024 * 1024,
  accept = "image/png,image/jpeg,image/webp,image/gif",
  className = "",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are permitted (PNG, JPEG, WebP, GIF)");
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrorMessage(`File size exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Upload failed");
      }

      onUploadSuccess({
        url: data.data.url,
        key: data.data.key,
        mimeType: data.data.mimeType,
        size: data.data.size,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  if (currentValue) {
    return (
      <div className={`relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 group ${className}`}>
        <img
          src={currentValue}
          alt="Uploaded preview"
          className="w-full max-h-64 object-contain bg-slate-100 dark:bg-slate-950"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 py-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Uploading image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs mb-2 text-slate-600 dark:text-slate-300">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {label}
            </p>
            <p className="text-2xs text-slate-500 mt-1">
              Drag and drop or browse (PNG, JPG, WebP up to 10MB)
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

