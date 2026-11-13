"use client";

import React, { useState } from "react";
import { PostResponse, PostType } from "@/types";

interface PostComposerProps {
  onPostCreated?: (post: PostResponse) => void;
  token?: string | null;
  communityId?: string;
  placeholder?: string;
}

interface MediaItemInput {
  url: string;
  key?: string;
  mimeType?: string;
  size?: number;
  order: number;
}

interface LinkItemInput {
  title: string;
  url: string;
}

export function PostComposer({ onPostCreated, token, communityId, placeholder }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("UPDATE");
  const [media, setMedia] = useState<MediaItemInput[]>([]);
  const [links, setLinks] = useState<LinkItemInput[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Local inputs
  const [newTag, setNewTag] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddTag = () => {
    const cleaned = newTag.trim().replace(/^#+/, "").toLowerCase();
    if (cleaned && /^[a-zA-Z0-9_]+$/.test(cleaned) && !tags.includes(cleaned)) {
      if (tags.length >= 15) {
        setErrorMessage("Maximum 15 tags permitted");
        return;
      }
      setTags([...tags, cleaned]);
      setNewTag("");
      setErrorMessage(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    try {
      const parsed = new URL(newLinkUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setErrorMessage("Link URL must start with http:// or https://");
        return;
      }
    } catch {
      setErrorMessage("Invalid link URL format");
      return;
    }

    if (links.length >= 10) {
      setErrorMessage("Maximum 10 links permitted");
      return;
    }

    setLinks([...links, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setShowLinkInput(false);
    setErrorMessage(null);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, idx) => idx !== index));
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    if (media.length + files.length > 10) {
      setErrorMessage("Maximum 10 media files permitted per post");
      return;
    }

    setIsUploadingMedia(true);
    setErrorMessage(null);

    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files (PNG, JPG, WebP, GIF) are supported");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Each image must be under 10MB");
        }

        const formData = new FormData();
        formData.append("file", file);

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/v1/media/upload", {
          method: "POST",
          headers,
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || "Failed to upload image");
        }

        return {
          url: data.data.url,
          key: data.data.key,
          mimeType: data.data.mimeType,
          size: data.data.size,
          order: media.length + idx,
        } as MediaItemInput;
      });

      const uploaded = await Promise.all(uploadPromises);
      setMedia((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await uploadFiles(files);
      event.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updated = media
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, order: idx }));
    setMedia(updated);
  };

  const handleMoveMedia = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= media.length) return;
    const reordered = [...media];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setMedia(reordered.map((item, idx) => ({ ...item, order: idx })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") || localStorage.getItem("poppin_token") : null);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content.trim(),
          type,
          communityId: communityId || undefined,
          links,
          tags,
          media,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create post");
      }

      // Reset form
      setContent("");
      setType("UPDATE");
      setMedia([]);
      setLinks([]);
      setTags([]);

      if (onPostCreated) {
        onPostCreated(data.data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-[#1E1F22] rounded-3xl border border-white/10 text-[#F2F3F5] transition-all p-5 sm:p-6 mb-6 relative shadow-lg ${
        isDragging
          ? "border-2 border-dashed border-[#5865F2] bg-[#5865F2]/10 ring-4 ring-[#5865F2]/20"
          : "border-white/10"
      }`}
    >
      {/* Drag & Drop Overlay Hint */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-[#080914]/90 rounded-3xl border-2 border-dashed border-[#5865F2] flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <svg className="w-10 h-10 text-[#5865F2] animate-bounce mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-bold text-white">Drop images here to attach</p>
          <p className="text-xs text-zinc-400 mt-1">Supports PNG, JPG, WebP, GIF up to 10MB</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Post Type Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="text-xs font-semibold text-zinc-400 mr-1">
            Post type:
          </span>
          {(
            [
              { id: "UPDATE", label: "Update" },
              { id: "PROJECT_SHOWCASE", label: "Project Showcase" },
              { id: "ACHIEVEMENT", label: "Achievement" },
              { id: "LOOKING_FOR", label: "Looking for..." },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                type === t.id
                  ? "bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/25"
                  : "bg-[#313338] text-zinc-400 hover:text-white hover:bg-[#383A40]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Text Content Area */}
        <div className="relative mb-3.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder || "Share an update, showcase project milestones, or start a discussion..."}
            rows={4}
            maxLength={5000}
            className="w-full p-4 text-sm text-white bg-[#141517] border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500 resize-none font-sans"
          />
          <div className="flex justify-end text-[11px] font-mono text-zinc-500 mt-1">
            {content.length}/5000
          </div>
        </div>

        {/* Uploaded Media Thumbnails with Display Order */}
        {media.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-zinc-400 block mb-2">
              Attached Media ({media.length}/10):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {media.map((item, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-xl overflow-hidden bg-[#141517] border border-white/10 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono font-semibold">
                    #{idx + 1}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveMedia(idx, idx - 1)}
                        className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40 text-white text-xs"
                        title="Move left"
                      >
                        ◀
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    {idx < media.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveMedia(idx, idx + 1)}
                        className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40 text-white text-xs"
                        title="Move right"
                      >
                        ▶
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attached Links Preview */}
        {links.length > 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#141517] border border-white/10 text-xs text-white"
              >
                <div className="truncate mr-2">
                  <span className="font-semibold text-white mr-2">{link.title}</span>
                  <span className="text-zinc-400 font-mono text-[11px]">{link.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-zinc-400 hover:text-rose-400 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link Input Section */}
        {showLinkInput && (
          <div className="p-3 mb-3 bg-[#141517] border border-white/10 rounded-xl flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Link title (e.g. GitHub Repository)"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="p-2 text-xs bg-[#1E1F22] border border-white/10 text-white rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-[#5865F2] placeholder:text-zinc-500"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="p-2 text-xs bg-[#1E1F22] border border-white/10 text-white rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-[#5865F2] placeholder:text-zinc-500"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3.5 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#8A9BFF] text-xs font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-zinc-400 hover:text-white ml-0.5 text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tag Input Bar */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Add hashtag (press Enter or Add)..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="p-2.5 text-xs bg-[#141517] border border-white/10 text-white rounded-xl w-64 focus:outline-none focus:ring-1 focus:ring-[#5865F2] placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white border border-white/10 rounded-xl hover:bg-white/5"
          >
            Add Tag
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mb-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-3.5 border-t border-white/10">
          <div className="flex items-center gap-2">
            {/* Image Upload Input */}
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors border border-white/10">
              <svg className="w-4 h-4 text-[#8A9BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{isUploadingMedia ? "Uploading..." : "Add Images"}</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                disabled={isUploadingMedia || isSubmitting}
                className="hidden"
              />
            </label>

            {/* Link Toggle Button */}
            <button
              type="button"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
            >
              <svg className="w-4 h-4 text-[#8A9BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Attach Link</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploadingMedia || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-[#5865F2]/25 transition-all cursor-pointer"
          >
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

