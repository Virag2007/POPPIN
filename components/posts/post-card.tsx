"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PostResponse, PostType } from "@/types";
import { LikeButton } from "@/components/engagement/like-button";
import { SaveButton } from "@/components/engagement/save-button";
import {
  MessageSquare,
  Share2,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  Zap,
  Flame,
  Award,
  HelpCircle,
} from "lucide-react";

interface PostCardProps {
  post: PostResponse;
  currentUserId?: string;
  token?: string | null;
  isModerator?: boolean;
  onEdit?: (post: PostResponse) => void;
  onDelete?: (postId: string) => Promise<void> | void;
}

const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  UPDATE: {
    label: "Update",
    badgeClass: "bg-[#5865F2]/10 text-[#8A9BFF] border-[#5865F2]/30",
    icon: Zap,
  },
  PROJECT_SHOWCASE: {
    label: "Project Showcase",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold",
    icon: Flame,
  },
  ACHIEVEMENT: {
    label: "Achievement",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold",
    icon: Award,
  },
  LOOKING_FOR: {
    label: "Looking for...",
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30 font-bold",
    icon: HelpCircle,
  },
};

export function PostCard({ post, currentUserId, token, isModerator = false, onEdit, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isOwner = Boolean(currentUserId && currentUserId === post.authorId);
  const canDelete = Boolean(isOwner || isModerator);
  const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.UPDATE;
  const BadgeIcon = typeConfig.icon;

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/posts/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(post.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const authorInitials = (post.author.displayName || post.author.username || "U")
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="bg-[#1E1F22] rounded-3xl border border-white/10 hover:border-white/20 transition-all p-5 sm:p-6 mb-4 text-[#F2F3F5] shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3">
          {post.author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatar}
              alt={post.author.displayName || post.author.username}
              className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-[#313338] text-[#8A9BFF] border border-white/10 flex items-center justify-center font-bold text-xs font-mono">
              {authorInitials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profiles/${encodeURIComponent(post.author.username)}`}
                className="font-heading font-bold text-white hover:text-[#8A9BFF] transition text-sm"
              >
                {post.author.displayName || post.author.username}
              </Link>
              <span className="text-zinc-400 font-mono text-xs">@{post.author.username}</span>
            </div>
            {post.author.headline && (
              <p className="text-xs text-zinc-400 line-clamp-1">{post.author.headline}</p>
            )}
            <span className="text-[11px] text-zinc-500 font-mono">{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Post Type Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.badgeClass}`}
          >
            <BadgeIcon className="w-3 h-3" />
            {typeConfig.label}
          </span>

          {/* Owner / Moderator Actions */}
          {(isOwner || canDelete) && (
            <div className="flex items-center gap-1 ml-1">
              {isOwner && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(post)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition text-xs"
                  title="Edit post"
                  aria-label="Edit post"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition text-xs disabled:opacity-50"
                  title={isOwner ? "Delete post" : "Delete post (as moderator)"}
                  aria-label="Delete post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-zinc-200 text-sm whitespace-pre-line leading-relaxed mb-4 font-sans">
        {post.content}
      </div>

      {/* Media Images Gallery */}
      {post.media && post.media.length > 0 && (
        <div
          className={`grid gap-2 mb-4 rounded-2xl overflow-hidden ${
            post.media.length === 1
              ? "grid-cols-1"
              : post.media.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 md:grid-cols-3"
          }`}
        >
          {post.media.map((item) => (
            <div
              key={item.id}
              className="relative aspect-video bg-[#141517] rounded-xl overflow-hidden group border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt="Post attachment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      {post.links && post.links.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          {post.links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141517] hover:bg-[#25272B] border border-white/10 text-xs transition group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8A9BFF] shrink-0" />
              <span className="font-semibold text-white group-hover:text-[#8A9BFF] line-clamp-1">
                {link.title}
              </span>
              <span className="text-zinc-400 ml-auto font-mono text-[10px] truncate max-w-xs">
                {link.url}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-[#B5BAC1] border border-white/10 hover:bg-white/10 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Interaction Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <LikeButton
            postId={post.id}
            initialLiked={post.isLiked}
            initialCount={post.likesCount}
            token={token}
          />

          {/* Comments Button */}
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>{post.commentsCount}</span>
          </Link>

          {/* Save Button */}
          <SaveButton
            postId={post.id}
            initialSaved={post.isSaved}
            token={token}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition text-xs font-semibold"
            title="Copy share link"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#5865F2]" />
                <span className="text-[#5865F2]">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
