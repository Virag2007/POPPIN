"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Layers,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PostType } from "@/types";

interface CommunityOption {
  id: string;
  name: string;
  slug: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const { token } = useAuth();
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("UPDATE");
  const [tagsInput, setTagsInput] = useState("");
  const [communityId, setCommunityId] = useState<string>("");
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available communities for selector
  useEffect(() => {
    async function loadCommunities() {
      try {
        const res = await fetch("/api/v1/communities?limit=20");
        const data = await res.json();
        interface CommunityItemResponse {
          id: string;
          name: string;
          slug: string;
        }
        if (res.ok && data.success && data.data?.items) {
          setCommunities(
            (data.data.items as CommunityItemResponse[]).map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
            }))
          );
        }
      } catch {
        // Continue
      }
    }
    if (isOpen) {
      loadCommunities();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#+/, ""))
      .filter((t) => t.length > 0);

    try {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content.trim(),
          type,
          communityId: communityId || undefined,
          tags,
          links: [],
          media: [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setContent("");
        setTagsInput("");
        setCommunityId("");
        onClose();
        if (onPostCreated) onPostCreated();
      } else {
        setErrorMsg(data.error?.message || "Failed to publish post.");
      }
    } catch {
      setErrorMsg("Network error publishing post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#1E1F22] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#F2F3F5]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#17181B]">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold text-white">Create Post</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(
              [
                ["UPDATE", "Update"],
                ["PROJECT_SHOWCASE", "Showcase"],
                ["ACHIEVEMENT", "Achievement"],
                ["LOOKING_FOR", "Looking For"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setType(val)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  type === val
                    ? "bg-[#5865F2] text-white shadow-xs"
                    : "bg-[#313338] text-zinc-400 hover:text-white hover:bg-[#383A40]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Community Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="flex-1 bg-[#313338] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
            >
              <option value="" className="bg-[#1E1F22] text-white">Public Home Feed (No Community)</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1E1F22] text-white">
                  c/{c.slug} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Content Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="What are you building or exploring today? Share code snippets, milestones, or questions..."
            className="w-full bg-[#141517] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all resize-none"
            required
          />

          {/* Tags Input */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Tags (space or comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. typescript, nextjs, distributed"
              className="w-full bg-[#141517] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-mono">
              {content.length}/5000
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-[#5865F2]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
