"use client";

import React, { useState } from "react";
import { PostResponse, PostType, UpdatePostInput } from "@/types";

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">Edit Post</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Post Type Selector */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Post Type</label>
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    type === t.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={5000}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="p-1.5 text-xs border border-gray-300 rounded flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Add
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 mb-3 bg-red-50 text-red-700 rounded text-xs border border-red-200">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

