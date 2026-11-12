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
    <article className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors mb-3 overflow-hidden flex">
      {/* Reddit Left Rail: Vote Column */}
      <div className="w-11 sm:w-12 bg-slate-50/80 border-r border-slate-200/70 p-1.5 flex flex-col items-center shrink-0">
        <button
          type="button"
          onClick={() => {
            if (downvoted) setDownvoted(false);
            onLikeToggle(post.id);
          }}
          className={`p-1 rounded hover:bg-slate-200 transition-colors ${
            post.isLiked ? "text-orange-600 bg-orange-50" : "text-slate-400 hover:text-orange-600"
          }`}
          title="Upvote"
          aria-label="Upvote"
        >
          <ArrowBigUp className={`w-6 h-6 ${post.isLiked ? "fill-orange-600" : ""}`} />
        </button>

        <span
          className={`text-xs font-bold font-mono my-0.5 ${
            post.isLiked
              ? "text-orange-600"
              : downvoted
              ? "text-blue-600"
              : "text-slate-700"
          }`}
        >
          {displayScore}
        </span>

        <button
          type="button"
          onClick={handleDownvote}
          className={`p-1 rounded hover:bg-slate-200 transition-colors ${
            downvoted ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-600"
          }`}
          title="Downvote"
          aria-label="Downvote"
        >
          <ArrowBigDown className={`w-6 h-6 ${downvoted ? "fill-blue-600" : ""}`} />
        </button>
      </div>

      {/* Main Post Column */}
      <div className="flex-1 p-3.5 sm:p-4">
        {/* Post Metadata Header */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 mb-2">
          {/* Community Badge */}
          <Link
            href={`/communities/${communitySlug}`}
            className="font-bold text-slate-900 hover:underline flex items-center gap-1.5"
            title={communityName}
          >
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
              c/
            </span>
            <span>c/{communitySlug}</span>
          </Link>

          <span className="text-slate-300">•</span>

          {/* Author */}
          <span className="text-slate-500 inline-flex items-center gap-1.5">
            {avatar && <AvatarImage src={avatar} alt={username} size="sm" />}
            <span>Posted by</span>{" "}
            <Link
              href={`/profiles/${username}`}
              className="hover:underline font-medium text-slate-700"
              title={displayName}
            >
              u/{username}
            </Link>
          </span>

          <span className="text-slate-300">•</span>

          {/* Timestamp */}
          <span className="text-slate-400">{post.createdAt}</span>

          {/* Flairs / Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Body Content */}
        <div className="text-slate-900 text-sm leading-relaxed whitespace-pre-line mb-3 font-normal">
          {post.content}
        </div>

        {/* Attached Media */}
        {post.mediaUrl && (
          <PostImage
            src={post.mediaUrl}
            alt="Post attachment"
            className="mb-3"
          />
        )}

        {/* Reddit Action Bar */}
        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold pt-1">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`min-h-[32px] px-2.5 py-1 rounded hover:bg-slate-100 flex items-center gap-1.5 transition-colors ${
              showComments ? "bg-slate-100 text-blue-600 font-bold" : ""
            }`}
          >
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>{post.commentsCount} Comments</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="min-h-[32px] px-2.5 py-1 rounded hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied Link</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onBookmarkToggle(post.id)}
            className={`min-h-[32px] px-2.5 py-1 rounded hover:bg-slate-100 flex items-center gap-1.5 transition-colors ${
              post.isBookmarked ? "text-blue-600 font-bold" : ""
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? "fill-blue-600 text-blue-600" : "text-slate-400"}`} />
            <span>{post.isBookmarked ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Nested Comments Drawer */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-slate-200">
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
