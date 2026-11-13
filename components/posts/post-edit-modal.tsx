"use client";

import React, { useState, useEffect } from "react";
import { PostResponse, PostType, UpdatePostInput } from "@/types";
import { X } from "lucide-react";

interface PostEditModalProps {
  post: PostResponse;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedPost: PostResponse) => void;
  token?: string | null;
}

export function PostEditModal({
  post,
  isOpen,
  onClose,
  onUpdated,
  token,
}: PostEditModalProps) {
  const [content, setContent] = useState(post.content);
  const [type, setType] = useState<PostType>(post.type);
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const cleaned = newTag.trim().replace(/^#+/, "").toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: UpdatePostInput = {
        content: content.trim(),
        type,
        tags,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/posts/${post.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update post");
      }

      onUpdated(data.data);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-post-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-[#2B2D31] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-6 text-[#F2F3F5] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <h3 id="edit-post-title" className="font-bold text-sm font-heading text-white">
            Edit Post
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#B5BAC1] hover:text-white p-1 rounded-lg hover:bg-[#383A40] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="text-xs font-semibold text-[#B5BAC1] block mb-1.5 font-heading">
              Post Type
            </label>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    type === t.id
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "bg-[#383A40] text-[#B5BAC1] hover:text-white hover:bg-[#313338]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-semibold text-[#B5BAC1] block mb-1.5 font-heading">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="What are you building or sharing?"
              className="w-full p-3 text-sm text-[#F2F3F5] bg-[#383A40] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-zinc-500 font-sans resize-none transition-all"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-[#B5BAC1] block mb-1.5 font-heading">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#383A40] text-zinc-300 text-xs border border-white/5 font-mono"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag and press Enter..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="p-2 text-xs text-white bg-[#383A40] border border-white/10 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-zinc-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-xs bg-[#383A40] hover:bg-[#313338] text-white rounded-xl font-medium border border-white/10 transition"
              >
                Add
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs border border-red-500/20">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-[#B5BAC1] hover:text-white hover:bg-white/5 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-xs font-bold transition disabled:opacity-40 shadow-xs"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
