/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FeedPost, PostComment } from "@/types";
import { CommentDrawer } from "./CommentDrawer";
import { AvatarImage } from "@/components/ui/avatar-image";
import { PostImage } from "@/components/ui/post-image";
import {
  ArrowBigUp,
  ArrowBigDown,
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
  const [downvoted, setDownvoted] = useState(false);

  const username = post.authorUsername || post.author?.username || "creator";
  const displayName = post.authorName || post.author?.displayName || "Creator";
  const avatar = post.authorAvatar !== undefined ? post.authorAvatar : (post.author?.avatar || null);
  const communitySlug = post.community?.slug || "general";
  const communityName = post.community?.name || "General";

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profiles/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownvote = () => {
    setDownvoted(!downvoted);
  };

  const displayScore = post.likesCount - (downvoted ? 1 : 0);

  return (
    <article className="bg-white rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors mb-3 overflow-hidden flex">
      {/* Vote Column */}
      <div className="w-11 sm:w-12 bg-zinc-50 border-r border-zinc-200 p-1.5 flex flex-col items-center shrink-0">
        <button
          type="button"
          onClick={() => {
            if (downvoted) setDownvoted(false);
            onLikeToggle(post.id);
          }}
          className={`p-1 rounded-lg hover:bg-zinc-200 transition-colors ${
            post.isLiked ? "text-zinc-900 bg-zinc-200/80" : "text-zinc-400 hover:text-zinc-900"
          }`}
          title="Upvote"
          aria-label="Upvote"
        >
          <ArrowBigUp className={`w-6 h-6 ${post.isLiked ? "fill-zinc-900 text-zinc-900" : ""}`} />
        </button>

        <span
          className={`text-xs font-bold font-mono my-0.5 ${
            post.isLiked
              ? "text-zinc-900"
              : downvoted
              ? "text-zinc-600"
              : "text-zinc-700"
          }`}
        >
          {displayScore}
        </span>

        <button
          type="button"
          onClick={handleDownvote}
          className={`p-1 rounded-lg hover:bg-zinc-200 transition-colors ${
            downvoted ? "text-zinc-700 bg-zinc-200/80" : "text-zinc-400 hover:text-zinc-700"
          }`}
          title="Downvote"
          aria-label="Downvote"
        >
          <ArrowBigDown className={`w-6 h-6 ${downvoted ? "fill-zinc-700 text-zinc-700" : ""}`} />
        </button>
      </div>

      {/* Main Post Column */}
      <div className="flex-1 p-4">
        {/* Post Metadata Header */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500 mb-2.5">
          {/* Community Badge */}
          <Link
            href={`/communities/${communitySlug}`}
            className="font-bold text-zinc-900 hover:underline flex items-center gap-1.5"
            title={communityName}
          >
            <span className="w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] font-black flex items-center justify-center">
              c/
            </span>
            <span>c/{communitySlug}</span>
          </Link>

          <span className="text-zinc-300">•</span>

          {/* Author */}
          <span className="text-zinc-500 inline-flex items-center gap-1.5">
            {avatar && <AvatarImage src={avatar} alt={username} size="sm" />}
            <span>Posted by</span>{" "}
            <Link
              href={`/profiles/${username}`}
              className="hover:underline font-medium text-zinc-700"
              title={displayName}
            >
              @{username}
            </Link>
          </span>

          <span className="text-zinc-300">•</span>

          {/* Timestamp */}
          <span className="text-zinc-400">{post.createdAt}</span>

          {/* Flairs / Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Body Content */}
        <div className="text-zinc-900 text-sm leading-relaxed whitespace-pre-line mb-3 font-normal font-sans">
          {post.content}
        </div>

        {/* Attached Media */}
        {post.mediaUrl && (
          <PostImage
            src={post.mediaUrl}
            alt="Post attachment"
            className="mb-3 rounded-xl border border-zinc-200"
          />
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium pt-1">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg hover:bg-zinc-100 flex items-center gap-1.5 transition-colors ${
              showComments ? "bg-zinc-100 text-zinc-900 font-semibold" : ""
            }`}
          >
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span>{post.commentsCount} Comments</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="min-h-[32px] px-2.5 py-1 rounded-lg hover:bg-zinc-100 flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied Link</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onBookmarkToggle(post.id)}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg hover:bg-zinc-100 flex items-center gap-1.5 transition-colors ${
              post.isBookmarked ? "text-zinc-900 font-semibold" : ""
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? "fill-zinc-900 text-zinc-900" : "text-zinc-400"}`} />
            <span>{post.isBookmarked ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Nested Comments Drawer */}
        {showComments && (
          <div className="mt-3.5 pt-3.5 border-t border-zinc-100">
            <CommentDrawer
              postId={post.id}
              comments={post.comments || []}
              onAddComment={onAddComment}
            />
          </div>
        )}
      </div>
    </article>
  );
}
