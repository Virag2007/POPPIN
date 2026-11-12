/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Community, FeedPost } from "@/types";
import { INITIAL_COMMUNITIES } from "@/lib/mock-communities";
import { PostComposer } from "@/components/feed";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Plus,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Flame,
  Sparkles,
  Award,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Calendar,
  Check,
  Mail,
  Send,
} from "lucide-react";

interface CommunitySlugParams {
  slug: string;
}

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<CommunitySlugParams>;
}) {
  const resolvedParams = use(params);

  // Find community or create fallback
  const communityData = INITIAL_COMMUNITIES.find(
    (c) => c.slug === resolvedParams.slug
  ) || {
    id: `comm_${resolvedParams.slug}`,
    slug: resolvedParams.slug,
    name: resolvedParams.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    tagline: "A vibrant subreddit exploring cutting-edge discussions and craft.",
    description: `Welcome to the official hub for r/${resolvedParams.slug}. Share insights, ask questions, and showcase high-craft projects with fellow members.`,
    category: "General",
    avatar:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    membersCount: 428,
    isMember: false,
    rules: [
      "Critique work constructively and uphold community standards.",
      "No spam, unsolicited self-promotion, or low-effort submissions.",
      "Maintain respectful and inclusive discourse at all times.",
      "Use descriptive titles and add appropriate flairs.",
    ],
    moderators: [
      { id: "alex", username: "alex_design", displayName: "Alex Rivera" },
      { id: "sarah", username: "sarah_code", displayName: "Sarah Chen" },
    ],
  };

  const [community, setCommunity] = useState<Community>(communityData);
  const [activeSort, setActiveSort] = useState<"hot" | "new" | "top">("hot");
  const [copiedLink, setCopiedLink] = useState(false);

  // Reddit-style discussion posts with upvotes/downvotes
  const [posts, setPosts] = useState<
    (FeedPost & {
      userVote?: "up" | "down" | null;
      score: number;
      flair?: string;
      title?: string;
    })[]
  >([
    {
      id: `comm_post_1_${community.slug}`,
      authorId: "sarah",
      authorName: "Sarah Chen",
      authorUsername: "sarah_code",
      authorAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      authorHeadline: "Distributed Systems Architect",
      title: `What is everyone working on this week in r/${community.slug}?`,
      content: `Welcome to r/${community.slug}! 🚀 Drop your latest prototypes, architectural questions, or design challenges below. Let's give each other actionable feedback and celebrate what we're building.`,
      flair: "Discussion",
      score: 47,
      userVote: null,
      createdAt: "2 hours ago",
      likesCount: 47,
      commentsCount: 14,
      isLiked: false,
      isBookmarked: false,
      tags: ["Discussion", "Showcase"],
      comments: [
        {
          id: "cm_1",
          authorId: "alex",
          authorName: "Alex Rivera",
          authorUsername: "alex_design",
          authorAvatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          content: "Just finalized our new design token typography ramp with fluid sizing. Really excited to test it across mobile breakpoints!",
          createdAt: "1 hour ago",
        },
        {
          id: "cm_2",
          authorId: "marcus",
          authorName: "Marcus Vance",
          authorUsername: "marcus_ai",
          authorAvatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
          content: "Working on streaming agent tool-calls via WebSockets with instant UI updates. Latency dropped to sub-50ms.",
          createdAt: "45 minutes ago",
        },
      ],
    },
    {
      id: `comm_post_2_${community.slug}`,
      authorId: "alex",
      authorName: "Alex Rivera",
      authorUsername: "alex_design",
      authorAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      authorHeadline: "Principal Designer",
      title: "Lessons learned building Reddit-grade community interactions",
      content: "When building community products, deterministic state for votes and optimistic comment trees make the entire experience feel instantaneous. Here is a breakdown of our layout and interaction hierarchy.",
      mediaUrl:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
      flair: "Insight",
      score: 112,
      userVote: "up",
      createdAt: "5 hours ago",
      likesCount: 112,
      commentsCount: 29,
      isLiked: true,
      isBookmarked: true,
      tags: ["Design", "Architecture"],
      comments: [],
    },
  ]);

  // Vote handler
  const handleVote = (postId: string, direction: "up" | "down") => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const currentVote = post.userVote;
        let newVote: "up" | "down" | null = direction;
        let scoreDelta = 0;

        if (currentVote === direction) {
          // Cancel vote
          newVote = null;
          scoreDelta = direction === "up" ? -1 : 1;
        } else if (currentVote === null) {
          scoreDelta = direction === "up" ? 1 : -1;
        } else {
          // Flip vote
          scoreDelta = direction === "up" ? 2 : -2;
        }

        return {
          ...post,
          userVote: newVote,
          score: post.score + scoreDelta,
        };
      })
    );
  };

  const handleToggleJoin = () => {
    setCommunity((prev) => ({
      ...prev,
      isMember: !prev.isMember,
      membersCount: prev.isMember ? prev.membersCount - 1 : prev.membersCount + 1,
    }));
  };

  const handlePostCreated = (newPost: FeedPost) => {
    const redditPost = {
      ...newPost,
      score: 1,
      userVote: "up" as const,
      flair: newPost.tags?.[0] || "Post",
      title: newPost.content.slice(0, 60) + (newPost.content.length > 60 ? "..." : ""),
    };
    setPosts((prev) => [redditPost, ...prev]);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#DAE0E6] flex flex-col">
      {/* Top Banner */}
      <div className="w-full h-36 sm:h-48 md:h-56 relative bg-slate-800">
        <img
          src={community.coverImage}
          alt={community.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Subreddit Header Strip */}
      <div className="bg-white border-b border-[#CCCCCC] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4">
            <div className="flex items-end gap-4 -mt-10 sm:-mt-12 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md shrink-0">
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2 sm:pt-0">
                <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C] flex items-center gap-2">
                  <span>{community.name}</span>
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  r/{community.slug}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Copied!" : "Share"}</span>
              </button>
              <button
                onClick={handleToggleJoin}
                className={`px-6 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-xs ${
                  community.isMember
                    ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300"
                    : "bg-poppin-lilac hover:bg-poppin-lilac-hover text-white"
                }`}
              >
                {community.isMember ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Joined
                  </span>
                ) : (
                  "Join Community"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reddit 2-Column Content Layout */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Post Composer */}
            <PostComposer onPostCreated={handlePostCreated} />

            {/* Reddit Sort Bar */}
            <div className="bg-white rounded-xl border border-[#CCCCCC] p-2 flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setActiveSort("hot")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSort === "hot"
                    ? "bg-slate-100 text-poppin-lilac shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Hot</span>
              </button>
              <button
                onClick={() => setActiveSort("new")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSort === "new"
                    ? "bg-slate-100 text-poppin-lilac shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>New</span>
              </button>
              <button
                onClick={() => setActiveSort("top")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSort === "top"
                    ? "bg-slate-100 text-poppin-lilac shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Top</span>
              </button>
            </div>

            {/* Reddit Post Stream */}
            <div className="space-y-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-[#CCCCCC] hover:border-slate-400 transition-colors shadow-2xs overflow-hidden flex"
                >
                  {/* Left Reddit Voting Gutter */}
                  <div className="w-10 sm:w-12 bg-slate-50/70 p-1.5 flex flex-col items-center justify-start border-r border-slate-100 shrink-0 select-none">
                    <button
                      onClick={() => handleVote(post.id, "up")}
                      className={`p-1 rounded-md hover:bg-slate-200 transition ${
                        post.userVote === "up" ? "text-poppin-lilac font-black" : "text-slate-400"
                      }`}
                      title="Upvote"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <span
                      className={`text-xs font-bold my-0.5 ${
                        post.userVote === "up"
                          ? "text-poppin-lilac"
                          : post.userVote === "down"
                          ? "text-indigo-600"
                          : "text-slate-700"
                      }`}
                    >
                      {post.score}
                    </span>
                    <button
                      onClick={() => handleVote(post.id, "down")}
                      className={`p-1 rounded-md hover:bg-slate-200 transition ${
                        post.userVote === "down" ? "text-indigo-600 font-black" : "text-slate-400"
                      }`}
                      title="Downvote"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Main Content */}
                  <div className="p-3.5 sm:p-4 flex-1 min-w-0">
                    {/* Header: Author + Flair + Timestamp */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                      <Link
                        href={`/profiles/${post.authorUsername}`}
                        className="flex items-center gap-1.5 font-bold text-slate-800 hover:underline"
                      >
                        <img
                          src={post.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={post.authorName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>u/{post.authorUsername}</span>
                      </Link>
                      <span>&bull;</span>
                      <span>{post.createdAt}</span>
                      {post.flair && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-poppin-lilac-light text-poppin-lilac border border-poppin-lilac-border">
                          {post.flair}
                        </span>
                      )}
                    </div>

                    {/* Title & Body */}
                    {post.title && (
                      <h2 className="text-base sm:text-lg font-bold text-[#1C1C1C] mb-1.5 leading-snug">
                        {post.title}
                      </h2>
                    )}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-3">
                      {post.content}
                    </p>

                    {/* Attached Media */}
                    {post.mediaUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 my-3 max-h-96 bg-slate-900 flex items-center justify-center">
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </div>
                    )}

                    {/* Reddit Post Action Bar */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>{post.commentsCount} Comments</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
                      >
                        <Share2 className="w-4 h-4 text-slate-400" />
                        <span>Share</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition">
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span>Save</span>
                      </button>
                    </div>

                    {/* Inline Comments Section */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 bg-slate-50/60 p-3 rounded-xl">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Top Comments
                        </p>
                        {post.comments.map((cm) => (
                          <div key={cm.id} className="text-xs text-slate-700 pl-2 border-l-2 border-slate-300 py-0.5">
                            <span className="font-bold text-slate-900 mr-1.5">
                              u/{cm.authorUsername}:
                            </span>
                            <span>{cm.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Reddit Sidebar Column */}
          <div className="space-y-4">
            {/* Widget 1: About Community */}
            <div className="bg-white rounded-xl border border-[#CCCCCC] overflow-hidden shadow-2xs">
              <div className="bg-slate-800 text-white p-3 font-extrabold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>About Community</span>
                <span className="text-poppin-lilac font-mono">r/{community.slug}</span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {community.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Created November 2026</span>
                </div>

                {/* Member Stats */}
                <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-slate-100 text-center">
                  <div>
                    <p className="text-base font-extrabold text-[#1C1C1C]">
                      {community.membersCount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold">Members</p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-emerald-600 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      42
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold">Online</p>
                  </div>
                </div>

                <button
                  onClick={handleToggleJoin}
                  className={`w-full py-2 rounded-full text-xs font-bold transition shadow-xs ${
                    community.isMember
                      ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300"
                      : "bg-poppin-lilac hover:bg-poppin-lilac-hover text-white"
                  }`}
                >
                  {community.isMember ? "Joined r/" + community.slug : "Join r/" + community.slug}
                </button>
              </div>
            </div>

            {/* Widget 2: Community Rules */}
            <div className="bg-white rounded-xl border border-[#CCCCCC] overflow-hidden shadow-2xs">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 font-bold text-xs text-slate-800">
                r/{community.slug} Rules
              </div>
              <div className="p-4 divide-y divide-slate-100 text-xs">
                {community.rules.map((rule, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                    <span className="font-bold text-slate-900 mr-2">{idx + 1}.</span>
                    <span className="text-slate-600">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Moderators */}
            <div className="bg-white rounded-xl border border-[#CCCCCC] overflow-hidden shadow-2xs">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Moderators</span>
                <Link
                  href="/messages"
                  className="text-poppin-lilac hover:underline text-[11px] flex items-center gap-1 font-semibold"
                >
                  <Mail className="w-3 h-3" />
                  <span>Message Mods</span>
                </Link>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                {community.moderators.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between">
                    <Link
                      href={`/profiles/${mod.username}`}
                      className="font-bold text-slate-800 hover:text-poppin-lilac hover:underline"
                    >
                      u/{mod.username}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-semibold">Moderator</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
