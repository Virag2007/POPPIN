/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FeedPost } from "@/types";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Sparkles,
  Image as ImageIcon,
  Tag,
  Loader2,
} from "lucide-react";

interface PostComposerProps {
  onPostCreated: (post: FeedPost) => void;
}

const POPULAR_TOPICS = ["Design", "TypeScript", "AI", "Nextjs", "Showcase", "Idea"];

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user, profile } = useAuth();

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  if (!user) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsPosting(true);

    // Simulate instant optimistic feed creation
    setTimeout(() => {
      const newPost: FeedPost = {
        id: "post_" + Date.now(),
        authorId: user.id,
        authorName: profile?.displayName || profile?.username || "You",
        authorUsername: profile?.username || "you",
        authorAvatar: profile?.avatar || null,
        authorHeadline: profile?.headline || null,
        content: content.trim(),
        mediaUrl: imageUrl.trim() || null,
        tags: selectedTags,
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
      setShowImageInput(false);
      setSelectedTags([]);
      setIsPosting(false);
    }, 250);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm mb-6 transition-all hover:border-slate-300">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3.5">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-poppin-lilac-light text-poppin-lilac font-black flex items-center justify-center text-sm shrink-0 border border-poppin-lilac-border overflow-hidden">
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
              maxLength={500}
              placeholder="What's poppin' today? Share an insight, project or discovery..."
              className="w-full p-2.5 rounded-2xl border-none text-sm sm:text-base font-medium text-poppin-navy placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none"
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

            {/* Tag Selection Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Tags:</span>
              </span>
              {POPULAR_TOPICS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`min-h-[26px] px-2.5 py-0.5 rounded-full text-2xs font-bold transition-all ${
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

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    showImageInput || imageUrl
                      ? "bg-poppin-lilac-light text-poppin-lilac font-bold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-poppin-lilac" />
                  <span className="hidden sm:inline">Add Media</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xs text-slate-400 font-semibold">
                  {content.length}/500
                </span>
                <button
                  type="submit"
                  disabled={isPosting || !content.trim()}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-poppin-navy text-white text-xs font-extrabold hover:bg-poppin-navy-light shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPosting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-poppin-lilac" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-poppin-lilac" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
