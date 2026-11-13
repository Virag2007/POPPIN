/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { FeedPost } from "@/types";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Image as ImageIcon,
  Tag,
  Loader2,
  Send,
} from "lucide-react";

interface PostComposerProps {
  onPostCreated: (post: FeedPost) => void;
}

const POPULAR_TOPICS = ["Design", "TypeScript", "AI", "Nextjs", "Showcase", "Idea"];

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!user) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Upload image file to server (/api/v1/media/upload -> S3/storage adapter)
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP, GIF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10MB");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Instant local preview for immediate responsive feel
      const localPreview = URL.createObjectURL(file);
      setImageUrl(localPreview);

      const token = typeof window !== "undefined" ? localStorage.getItem("poppin_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/media/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.url) {
        setImageUrl(json.data.url);
      } else {
        // Fallback to localPreview data
        console.warn("Upload returned message:", json.error?.message);
      }
    } catch (err) {
      console.error("Image upload error:", err);
      // Still keep localPreview so user can create post
    } finally {
      setIsUploading(false);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isUploading) return;

    setIsPosting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") || localStorage.getItem("poppin_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content.trim(),
          type: "UPDATE",
          tags: selectedTags,
          media: imageUrl ? [{ url: imageUrl, order: 0 }] : [],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const created = json.data;
        const newPost: FeedPost = {
          id: created.id,
          authorId: user.id,
          authorName: profile?.displayName || profile?.username || "You",
          authorUsername: profile?.username || "you",
          authorAvatar: profile?.avatar || null,
          authorHeadline: profile?.headline || null,
          content: created.content,
          mediaUrl: created.media?.[0]?.url || null,
          tags: created.tags || [],
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isBookmarked: false,
          comments: [],
          createdAt: "Just now",
        };

        onPostCreated(newPost);
        setContent("");
        setImageUrl("");
        setSelectedTags([]);
      }
    } catch (err) {
      console.error("Failed to persist post:", err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all mb-6 ${
        isDragging
          ? "border-poppin-lilac ring-2 ring-poppin-lilac/30 bg-poppin-lilac-light/20"
          : "border-slate-200/90 shadow-xs hover:border-slate-300"
      }`}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 overflow-hidden">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.displayName || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              profile?.username?.slice(0, 2).toUpperCase() || "ME"
            )}
          </div>

          {/* Text Area */}
          <div className="flex-1">
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              placeholder="Create a post or share an update with the community..."
              className="w-full p-2 rounded-xl border-none text-sm sm:text-base font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none"
            />

            {/* Attached Image Preview or Drag and Drop Uploader */}
            {(showImageInput || imageUrl) && (
              <div className="mt-2 mb-3">
                <FileUpload
                  currentValue={imageUrl || null}
                  onUploadSuccess={(file) => setImageUrl(file.url)}
                  onRemove={() => setImageUrl("")}
                  label="Drag and drop image or click to upload"
                />
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <p className="text-xs text-rose-600 font-medium mb-2">{uploadError}</p>
            )}

            {/* Tags Selector */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Topic:
              </span>
              {POPULAR_TOPICS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-poppin-lilac text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput((prev) => !prev)}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-poppin-lilac hover:bg-poppin-lilac-light transition-all border border-slate-200/80"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-poppin-lilac" />
                  <span>{imageUrl ? "Change Image" : showImageInput ? "Hide Uploader" : "Upload Image"}</span>
                </button>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  (or drag & drop here)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {content.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || isPosting || isUploading}
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-poppin-lilac hover:bg-poppin-lilac-hover disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
                >
                  {isPosting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Post</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
