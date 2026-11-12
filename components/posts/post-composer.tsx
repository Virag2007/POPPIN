"use client";

import React, { useState } from "react";
import { PostResponse, PostType } from "@/types";

interface PostComposerProps {
  onPostCreated?: (post: PostResponse) => void;
  token?: string | null;
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

export function PostComposer({ onPostCreated, token }: PostComposerProps) {
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

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    if (media.length + files.length > 10) {
      setErrorMessage("Maximum 10 media files permitted per post");
      return;
    }

    setIsUploadingMedia(true);
    setErrorMessage(null);

    try {
      const uploadPromises = files.map(async (file, idx) => {
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
    if (event.target.files) {
      await processFiles(event.target.files);
      event.target.value = "";
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content.trim(),
          type,
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
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
          processFiles(e.dataTransfer.files);
        }
      }}
      className={`bg-white rounded-xl border shadow-sm p-5 mb-6 transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50/20" : "border-gray-200"
      }`}
    >
      <form onSubmit={handleSubmit}>
        {/* Post Type Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
            Post Type:
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                type === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Text Content Area */}
        <div className="relative mb-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's poppin'? Share an update, showcase a project, or find collaborators..."
            rows={4}
            maxLength={5000}
            className="w-full p-3.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
          />
          <div className="flex justify-end text-2xs text-gray-400 mt-1">
            {content.length}/5000
          </div>
        </div>

        {/* Uploaded Media Thumbnails with Display Order */}
        {media.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-gray-500 block mb-2">
              Attached Media ({media.length}/10, drag or use arrows to set display order):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {media.map((item, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-md overflow-hidden bg-gray-100 border border-gray-200 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-2xs font-semibold">
                    #{idx + 1}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveMedia(idx, idx - 1)}
                        className="p-1 bg-white/80 rounded hover:bg-white text-gray-800 text-xs"
                        title="Move left"
                      >
                        ◀
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    {idx < media.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveMedia(idx, idx + 1)}
                        className="p-1 bg-white/80 rounded hover:bg-white text-gray-800 text-xs"
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
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
              >
                <div className="truncate mr-2">
                  <span className="font-semibold text-gray-800 mr-2">{link.title}</span>
                  <span className="text-gray-400">{link.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link Input Section */}
        {showLinkInput && (
          <div className="p-3 mb-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Link title (e.g. GitHub Repository)"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="p-2 text-xs border border-gray-300 rounded flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="p-2 text-xs border border-gray-300 rounded flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="px-2 py-1.5 text-gray-500 hover:text-gray-700 text-xs"
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-400 hover:text-blue-800 ml-1 text-2xs"
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
            className="p-2 text-xs border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Add Tag
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
            {errorMessage}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Image Upload Input */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            {isSubmitting ? "Publishing..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

