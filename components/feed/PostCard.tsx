/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FeedPost, PostComment } from "@/types";
import { CommentDrawer } from "./CommentDrawer";
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Check,
} from "lucide-react";

interface PostCardProps {
  post: FeedPost;
  onLikeToggle: (postId: string) => void;
  onBookmarkToggle: (postId: string) => void;
  onAddComment: (postId: string, comment: PostComment) => void;
}

export function PostCard({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onAddComment,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  const username = post.authorUsername || post.author?.username || "creator";
  const displayName = post.authorName || post.author?.displayName || "Creator";
  const avatar = post.authorAvatar !== undefined ? post.authorAvatar : (post.author?.avatar || null);
  const headline = post.authorHeadline || post.author?.role || null;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profiles/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <Link
          href={`/profiles/${username}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-full bg-poppin-lilac-light text-poppin-lilac font-black flex items-center justify-center text-sm shrink-0 border border-poppin-lilac-border overflow-hidden group-hover:scale-105 transition-transform">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              username.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-poppin-navy group-hover:text-poppin-lilac transition-colors">
                {displayName}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                @{username}
              </span>
            </div>
            {headline && (
              <p className="text-2xs text-slate-500 truncate max-w-xs sm:max-w-md font-medium">
                {headline}
              </p>
            )}
          </div>
        </Link>

        <span className="text-2xs text-slate-400 font-semibold shrink-0">
          {post.createdAt}
        </span>
      </div>

      {/* Post Content */}
      <div className="text-slate-800 text-sm sm:text-base font-normal leading-relaxed whitespace-pre-line mb-3">
        {post.content}
      </div>

      {/* Tag Chips */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-poppin-lilac-light text-poppin-navy border border-poppin-lilac-border"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Attached Media */}
      {post.mediaUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200/90 max-h-96 bg-slate-50">
          <img
            src={post.mediaUrl}
            alt="Attached content"
            className="w-full h-full object-cover hover:scale-101 transition-transform"
          />
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-500 text-xs font-semibold">
        {/* Like Button */}
        <button
          type="button"
          onClick={() => onLikeToggle(post.id)}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all group ${
            post.isLiked
              ? "text-rose-600 font-bold bg-rose-50"
              : "hover:text-rose-600 hover:bg-rose-50/50"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform group-hover:scale-120 ${
              post.isLiked ? "fill-rose-600 stroke-rose-600" : ""
            }`}
          />
          <span>{post.likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all hover:text-poppin-lilac hover:bg-poppin-lilac-light ${
            showComments ? "text-poppin-lilac font-bold bg-poppin-lilac-light" : ""
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="min-h-[38px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all hover:text-poppin-navy hover:bg-slate-100"
          title="Share profile link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={() => onBookmarkToggle(post.id)}
          className={`min-h-[38px] p-2 rounded-xl transition-all ${
            post.isBookmarked
              ? "text-poppin-lilac bg-poppin-lilac-light"
              : "hover:text-poppin-navy hover:bg-slate-100"
          }`}
          title="Bookmark post"
        >
          <Bookmark
            className={`w-4 h-4 ${
              post.isBookmarked ? "fill-poppin-lilac stroke-poppin-lilac" : ""
            }`}
          />
        </button>
      </div>

      {/* Nested Comments Drawer */}
      {showComments && (
        <CommentDrawer
          postId={post.id}
          comments={post.comments || []}
          onAddComment={onAddComment}
        />
      )}
    </article>
  );
}
