"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PostResponse, PostType } from "@/types";
import { LikeButton } from "@/components/engagement/like-button";
import { SaveButton } from "@/components/engagement/save-button";

interface PostCardProps {
  post: PostResponse;
  currentUserId?: string;
  token?: string | null;
  onEdit?: (post: PostResponse) => void;
  onDelete?: (postId: string) => Promise<void> | void;
}

const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; badgeClass: string }
> = {
  UPDATE: {
    label: "Update",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PROJECT_SHOWCASE: {
    label: "Project Showcase",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  ACHIEVEMENT: {
    label: "Achievement",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  LOOKING_FOR: {
    label: "Looking for...",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export function PostCard({ post, currentUserId, token, onEdit, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isOwner = Boolean(currentUserId && currentUserId === post.authorId);
  const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.UPDATE;

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
    year: "numeric",
  });

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {post.author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatar}
              alt={post.author.displayName || post.author.username}
              className="w-10 h-10 rounded-full object-cover border border-gray-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
              {authorInitials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profiles/${encodeURIComponent(post.author.username)}`}
                className="font-semibold text-gray-900 hover:underline text-sm"
              >
                {post.author.displayName || post.author.username}
              </Link>
              <span className="text-gray-400 text-xs">@{post.author.username}</span>
            </div>
            {post.author.headline && (
              <p className="text-xs text-gray-500 line-clamp-1">{post.author.headline}</p>
            )}
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Post Type Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConfig.badgeClass}`}
          >
            {typeConfig.label}
          </span>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center gap-1 ml-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(post)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  title="Edit post"
                  aria-label="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-red-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors text-xs disabled:opacity-50"
                  title="Delete post"
                  aria-label="Delete post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-800 text-sm whitespace-pre-line leading-relaxed mb-4">
        {post.content}
      </div>

      {/* Media Images Gallery */}
      {post.media && post.media.length > 0 && (
        <div
          className={`grid gap-2 mb-4 rounded-lg overflow-hidden ${
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
              className="relative aspect-video bg-gray-100 rounded-md overflow-hidden group border border-gray-200"
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
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="font-medium text-gray-800 line-clamp-1">{link.title}</span>
              <span className="text-gray-400 ml-auto text-2xs truncate max-w-xs">{link.url}</span>
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
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Interaction Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Copy share link"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>{copiedShare ? "Link copied!" : "Share"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

