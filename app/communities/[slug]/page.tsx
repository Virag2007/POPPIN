/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Community, FeedPost } from "@/types";
import { INITIAL_COMMUNITIES } from "@/lib/mock-communities";
import { PostComposer, PostCard } from "@/components/feed";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Sparkles,
  Share2,
  CheckCircle2,
  Plus,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Flame,
  Award,
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
    tagline: "A vibrant collective exploring cutting-edge ideas and collaboration.",
    description: `Welcome to the official hub for ${resolvedParams.slug}. Share insights, ask architectural questions, and showcase high-craft projects with fellow peers.`,
    category: "General",
    avatar:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    membersCount: 142,
    isMember: false,
    rules: [
      "Critique work constructively and uphold community standards.",
      "No spam or unsolicited self-promotion without context.",
      "Maintain respectful and inclusive discourse.",
    ],
    moderators: [
      { id: "alex", username: "alex_design", displayName: "Alex Rivera" },
    ],
  };

  const [community, setCommunity] = useState<Community>(communityData);
  const [activeTab, setActiveTab] = useState<
    "discussions" | "showcase" | "rules" | "members"
  >("discussions");
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch real community details from backend
  React.useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await fetch(`/api/v1/communities/${resolvedParams.slug}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setCommunity(data.data);
        }
      } catch {
        // Keep fallback
      }
    }
    fetchCommunity();
  }, [resolvedParams.slug]);

  // Mock community discussion posts
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([
    {
      id: `comm_post_1_${community.slug}`,
      author: {
        id: "sarah",
        username: "sarah_code",
        displayName: "Sarah Chen",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        role: "Systems Architect",
        isFollowing: true,
      },
      content: `Welcome everyone to c/${community.slug}! 🚀 What are the top challenges you are encountering right now? Drop your thoughts, questions, or showcase demos below!`,
      createdAt: "3 hours ago",
      likesCount: 34,
      isLiked: false,
      commentsCount: 8,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
      },
      tags: ["Discussion", "Welcome", "Insights"],
      comments: [
        {
          id: "cm_1",
          authorId: "alex",
          authorName: "Alex Rivera",
          authorUsername: "alex_design",
          authorAvatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          content:
            "Super excited for this community! Can't wait to see all the creative work.",
          createdAt: "2 hours ago",
          likesCount: 5,
        },
      ],
    },
    {
      id: `comm_post_2_${community.slug}`,
      author: {
        id: "marcus",
        username: "marcus_ai",
        displayName: "Marcus Vance",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        role: "ML Researcher & Agent Architect",
        isFollowing: false,
      },
      content: `Just published our benchmark comparisons for low-latency agent inference pipelines. Token streaming time-to-first-token dropped by 48% using adaptive speculative decoding. Full writeup coming later this week!`,
      createdAt: "6 hours ago",
      likesCount: 52,
      isLiked: true,
      commentsCount: 14,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
      },
      tags: ["Research", "Benchmarks", "Performance"],
      comments: [],
    },
  ]);

  // Show & Tell project showcase
  const showcaseProjects = [
    {
      id: "sh_1",
      title: "Hyperflow Micro-Animations",
      creator: "@alex_design",
      description:
        "A physics-based gesture interaction library for spring dynamics in WebGL and React.",
      image:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
      upvotes: 89,
      tags: ["WebGL", "Motion", "UI"],
    },
    {
      id: "sh_2",
      title: "Zero-Latency Token Streaming",
      creator: "@sarah_code",
      description:
        "High-throughput WebSocket proxy with dynamic backpressure buffer in Rust & Node.js.",
      image:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      upvotes: 114,
      tags: ["Rust", "WebSocket", "Perf"],
    },
    {
      id: "sh_3",
      title: "Agentic Canvas Workspace",
      creator: "@marcus_ai",
      description:
        "Spatial infinite canvas where autonomous agents execute subroutines in parallel sandboxes.",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
      upvotes: 142,
      tags: ["Agents", "Canvas", "AI"],
    },
  ];

  // Community members
  const [members, setMembers] = useState([
    {
      id: "mem_1",
      username: "alex_design",
      displayName: "Alex Rivera",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      role: "Hub Founder & Moderator",
      badge: "Founder",
      isFollowing: false,
    },
    {
      id: "mem_2",
      username: "sarah_code",
      displayName: "Sarah Chen",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      role: "Distributed Systems & Next.js Lead",
      badge: "Moderator",
      isFollowing: true,
    },
    {
      id: "mem_3",
      username: "marcus_ai",
      displayName: "Marcus Vance",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      role: "Agentic Systems Researcher",
      badge: "Core Member",
      isFollowing: false,
    },
  ]);

  const toggleJoin = async () => {
    const wasMember = community.isMember;
    setCommunity((prev) => ({
      ...prev,
      isMember: !prev.isMember,
      membersCount: prev.isMember
        ? Math.max(0, prev.membersCount - 1)
        : prev.membersCount + 1,
    }));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/v1/communities/${resolvedParams.slug}/join`, {
        method: wasMember ? "DELETE" : "POST",
        headers,
      });
    } catch {
      // rollback if failed
    }
  };

  const handleCreatePost = (newPost: FeedPost) => {
    setCommunityPosts([
      {
        ...newPost,
        community: {
          id: community.id,
          name: community.name,
          slug: community.slug,
        },
      },
      ...communityPosts,
    ]);
  };

  const handleLikePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }
        return p;
      })
    );
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleFollowMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isFollowing: !m.isFollowing } : m))
    );
  };

  return (
    <div className="min-vh-100 bg-slate-50/60 pb-20">
      {/* Community Banner */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-slate-900">
        <img
          src={community.coverImage}
          alt={community.name}
          className="w-full h-full object-cover opacity-75 transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Back Link */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 relative z-10">
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 transition shadow-sm border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Communities
          </Link>
        </div>
      </div>

      {/* Community Header Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg bg-slate-100 shrink-0">
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-poppin-lilac/10 text-poppin-lilac border border-poppin-lilac/20">
                    {community.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Hub
                  </span>
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {community.name}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  c/{community.slug}
                </p>
                <p className="text-slate-600 text-sm mt-2 max-w-2xl leading-relaxed">
                  {community.tagline}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
              <button
                onClick={handleShareLink}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition active:scale-95 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleJoin}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 shadow-sm ${
                  community.isMember
                    ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200"
                    : "bg-poppin-navy text-white hover:bg-poppin-navy/90 hover:shadow-poppin-navy/20"
                }`}
              >
                {community.isMember ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Joined Hub</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Join Hub</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hub Stats Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 sm:gap-10 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-poppin-lilac" />
              <span>
                <strong className="text-slate-900 font-bold font-mono">
                  {community.membersCount.toLocaleString()}
                </strong>{" "}
                Members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong className="text-slate-900 font-bold font-mono">
                  {Math.round(community.membersCount * 0.18)}
                </strong>{" "}
                Online now
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="text-slate-900 font-bold font-mono">
                  {communityPosts.length + 42}
                </strong>{" "}
                Discussions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Tabs & Content vs Sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("discussions")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "discussions"
                    ? "bg-poppin-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Discussions
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-white/20 text-white font-mono">
                  {communityPosts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("showcase")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "showcase"
                    ? "bg-poppin-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Show & Tell
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-poppin-lilac/10 text-poppin-lilac font-mono">
                  {showcaseProjects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("rules")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "rules"
                    ? "bg-poppin-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Guidelines
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "members"
                    ? "bg-poppin-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" />
                Members
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-slate-200 text-slate-700 font-mono">
                  {members.length}
                </span>
              </button>
            </div>

            {/* TAB: DISCUSSIONS */}
            {activeTab === "discussions" && (
              <div className="space-y-6">
                {/* Post Composer for Community */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-poppin-lilac" />
                    <span>Post directly into c/{community.slug}</span>
                  </div>
                  <PostComposer onPostCreated={handleCreatePost} />
                </div>

                {/* Posts stream */}
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLikeToggle={handleLikePost}
                      onBookmarkToggle={() => {}}
                      onAddComment={(postId, comment) => {
                        setCommunityPosts((prev) =>
                          prev.map((p) => {
                            if (p.id === postId) {
                              return {
                                ...p,
                                commentsCount: p.commentsCount + 1,
                                comments: [...(p.comments || []), comment],
                              };
                            }
                            return p;
                          })
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SHOWCASE */}
            {activeTab === "showcase" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-poppin-navy to-poppin-navy/90 text-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-heading text-lg font-bold">
                    Show & Tell Showcase
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                    Projects, experiments, code repos, and design systems built
                    by members of c/{community.slug}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showcaseProjects.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition group"
                    >
                      <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          <span>{item.upvotes}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-mono text-poppin-lilac font-medium">
                            {item.creator}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-slate-900 group-hover:text-poppin-lilac transition">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-medium text-slate-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          <button className="text-xs font-semibold text-poppin-navy hover:text-poppin-lilac inline-flex items-center gap-1">
                            <span>Inspect</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: RULES */}
            {activeTab === "rules" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-poppin-lilac" />
                    Community Norms & Guidelines
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Please read and adhere to our core standards when
                    participating in c/{community.slug}.
                  </p>
                </div>

                <div className="space-y-4">
                  {community.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-poppin-lilac/10 text-poppin-lilac font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          Rule #{idx + 1}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {rule}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    Violations may result in content removal or hub expulsion by
                    moderators to preserve community quality.
                  </span>
                </div>
              </div>
            )}

            {/* TAB: MEMBERS */}
            {activeTab === "members" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900">
                      Community Directory
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Meet founders, moderators, and active contributors.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {members.length} members shown
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {members.map((mem) => (
                    <div
                      key={mem.id}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={mem.avatar}
                          alt={mem.displayName}
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profiles/${mem.username}`}
                              className="font-semibold text-sm text-slate-900 hover:text-poppin-lilac transition"
                            >
                              {mem.displayName}
                            </Link>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-poppin-lilac/10 text-poppin-lilac">
                              {mem.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            @{mem.username} &bull; {mem.role}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollowMember(mem.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                          mem.isFollowing
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-poppin-navy text-white hover:bg-poppin-navy/90"
                        }`}
                      >
                        {mem.isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Rail */}
          <div className="lg:col-span-4 space-y-6">
            {/* About Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <h3 className="font-heading font-bold text-slate-900 text-sm mb-3">
                About this Hub
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {community.description}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="font-medium text-slate-700">
                    October 2026
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="font-medium text-slate-700">
                    {community.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Visibility</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Public Community
                  </span>
                </div>
              </div>
            </div>

            {/* Moderators Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <h3 className="font-heading font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-poppin-lilac" />
                Hub Moderators
              </h3>
              <div className="space-y-3">
                {community.moderators.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-poppin-lilac/20 text-poppin-navy font-bold flex items-center justify-center text-xs">
                        {mod.displayName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/profiles/${mod.username}`}
                          className="text-xs font-semibold text-slate-800 hover:text-poppin-lilac block transition"
                        >
                          {mod.displayName}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">
                          @{mod.username}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-poppin-lilac bg-poppin-lilac/10 px-2 py-0.5 rounded-full">
                      Mod
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Helpful Resources */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Community Charter
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                POPPIN hubs are governed by peer consensus and craft excellence.
                Spam, abusive conduct, or low-effort slop will be moderated
                swiftly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
