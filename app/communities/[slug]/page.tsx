/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Community, FeedPost } from "@/types";
import { PostComposer, PostCard } from "@/components/feed";
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
  Award,
} from "lucide-react";

interface CommunitySlugParams {
  slug: string;
}

interface CommunityPostApiItem {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    headline: string | null;
  };
  content: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount?: number;
  community?: { id: string; name: string; slug: string };
  tags?: string[];
  media?: { url: string }[];
}

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<CommunitySlugParams>;
}) {
  const resolvedParams = use(params);

  const [community, setCommunity] = useState<Community>({
    id: `comm_${resolvedParams.slug}`,
    slug: resolvedParams.slug,
    name: resolvedParams.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    tagline: "A vibrant collective exploring cutting-edge ideas and collaboration.",
    description: `Welcome to the official hub for ${resolvedParams.slug}. Share insights, ask architectural questions, and showcase high-craft projects with fellow peers.`,
    category: "General",
    avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    membersCount: 0,
    isMember: false,
    rules: [
      "Critique work constructively and uphold community standards.",
      "No spam or unsolicited self-promotion without context.",
      "Maintain respectful and inclusive discourse.",
    ],
    moderators: [],
  });

  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "discussions" | "showcase" | "rules" | "members"
  >("discussions");
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch real community details and posts from PostgreSQL backend
  React.useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // 1. Fetch Community details
        const commRes = await fetch(`/api/v1/communities/${resolvedParams.slug}`, { headers });
        const commData = await commRes.json();
        if (isMounted && commRes.ok && commData.success && commData.data) {
          setCommunity(commData.data);
        }

        // 2. Fetch Community Posts
        setIsLoadingPosts(true);
        const postsRes = await fetch(`/api/v1/communities/${resolvedParams.slug}/posts`, { headers });
        const postsData = await postsRes.json();
        if (isMounted && postsRes.ok && postsData.success && postsData.data?.items) {
          const mapped: FeedPost[] = (postsData.data.items as CommunityPostApiItem[]).map((p) => ({
            id: p.id,
            author: {
              id: p.author.id,
              username: p.author.username,
              displayName: p.author.displayName || p.author.username,
              avatar: p.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
              role: p.author.headline || "Builder",
              isFollowing: false,
            },
            content: p.content,
            createdAt: new Date(p.createdAt || Date.now()).toLocaleDateString(),
            likesCount: p.likesCount || 0,
            isLiked: p.isLiked || false,
            commentsCount: p.commentsCount || 0,
            community: {
              id: p.community?.id || commData.data?.id || "",
              name: p.community?.name || commData.data?.name || resolvedParams.slug,
              slug: p.community?.slug || resolvedParams.slug,
            },
            tags: p.tags || [],
            mediaUrl: p.media?.[0]?.url || undefined,
            comments: [],
          }));
          setCommunityPosts(mapped);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

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
    <div className="min-h-screen bg-[#FCFBF9] pb-20">
      {/* Community Banner */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-zinc-900">
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 transition shadow-xs border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Communities
          </Link>
        </div>
      </div>

      {/* Community Header Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-zinc-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xs bg-zinc-100 shrink-0 border border-zinc-200">
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                    {community.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Hub
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  {community.name}
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  c/{community.slug}
                </p>
                <p className="text-zinc-600 text-sm mt-2 max-w-2xl leading-relaxed font-sans">
                  {community.tagline}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
              <button
                onClick={handleShareLink}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition active:scale-95 shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-zinc-500" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleJoin}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition active:scale-95 shadow-xs ${
                  community.isMember
                    ? "bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-600 border border-zinc-200"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
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
          <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-wrap items-center gap-6 sm:gap-10 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-700" />
              <span>
                <strong className="text-zinc-900 font-bold font-mono">
                  {community.membersCount.toLocaleString()}
                </strong>{" "}
                Members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong className="text-zinc-900 font-bold font-mono">
                  {Math.round(community.membersCount * 0.18)}
                </strong>{" "}
                Online now
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <span>
                <strong className="text-zinc-900 font-bold font-mono">
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
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("discussions")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "discussions"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "showcase"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <Award className="w-4 h-4" />
                Show & Tell
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-zinc-100 text-zinc-700 font-mono">
                  {showcaseProjects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("rules")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "rules"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Guidelines
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "members"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <Users className="w-4 h-4" />
                Members
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-zinc-200 text-zinc-700 font-mono">
                  {members.length}
                </span>
              </button>
            </div>

            {/* TAB: DISCUSSIONS */}
            {activeTab === "discussions" && (
              <div className="space-y-6">
                {/* Post Composer for Community */}
                <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-500">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Post directly into c/{community.slug}</span>
                  </div>
                  <PostComposer onPostCreated={handleCreatePost} />
                </div>

                {/* Posts stream */}
                <div className="space-y-4">
                  {isLoadingPosts ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 shadow-xs">
                      <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-zinc-500 font-medium">Loading community discussions...</p>
                    </div>
                  ) : communityPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 shadow-xs">
                      <p className="text-sm font-semibold text-zinc-800">No discussions yet in c/{community.slug}</p>
                      <p className="text-xs text-zinc-500 mt-1">Be the first to share an update, showcase project, or start a thread!</p>
                    </div>
                  ) : (
                    communityPosts.map((post) => (
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
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SHOWCASE */}
            {activeTab === "showcase" && (
              <div className="space-y-6">
                <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xs">
                  <h3 className="font-display text-lg font-bold">
                    Show & Tell Showcase
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-1 max-w-xl font-sans">
                    Projects, experiments, code repos, and design systems built
                    by members of c/{community.slug}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showcaseProjects.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:border-zinc-300 transition group"
                    >
                      <div className="h-44 w-full overflow-hidden bg-zinc-100 relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-zinc-800 shadow-xs flex items-center gap-1.5 border border-zinc-200">
                          <Flame className="w-3.5 h-3.5 text-zinc-700" />
                          <span>{item.upvotes}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                          <span className="font-mono text-zinc-700 font-medium">
                            {item.creator}
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-900 group-hover:underline transition">
                          {item.title}
                        </h4>
                        <p className="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed font-sans">
                          {item.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-zinc-100 rounded-md text-[10px] font-medium text-zinc-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          <button className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1">
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
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-zinc-700" />
                    Community Norms & Guidelines
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Please read and adhere to our core standards when
                    participating in c/{community.slug}.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {community.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-800 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-800">
                          Rule #{idx + 1}
                        </h4>
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed font-sans">
                          {rule}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-zinc-800 shrink-0" />
                  <span>
                    Violations may result in content removal or hub expulsion by
                    moderators to preserve community quality.
                  </span>
                </div>
              </div>
            )}

            {/* TAB: MEMBERS */}
            {activeTab === "members" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      Community Directory
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Meet founders, moderators, and active contributors.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-500">
                    {members.length} members shown
                  </span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {members.map((mem) => (
                    <div
                      key={mem.id}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={mem.avatar}
                          alt={mem.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profiles/${mem.username}`}
                              className="font-semibold text-sm text-zinc-900 hover:underline transition"
                            >
                              {mem.displayName}
                            </Link>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                              {mem.badge}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            @{mem.username} &bull; {mem.role}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollowMember(mem.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${
                          mem.isFollowing
                            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            : "bg-zinc-900 text-white hover:bg-zinc-800"
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
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-sm mb-3">
                About this Hub
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                {community.description}
              </p>

              <div className="mt-5 pt-4 border-t border-zinc-100 space-y-2.5 text-xs text-zinc-600">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Created</span>
                  <span className="font-medium text-zinc-700">
                    October 2026
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Category</span>
                  <span className="font-medium text-zinc-700">
                    {community.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Visibility</span>
                  <span className="font-medium text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Public Community
                  </span>
                </div>
              </div>
            </div>

            {/* Moderators Card */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-zinc-700" />
                Hub Moderators
              </h3>
              <div className="space-y-3">
                {community.moderators.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-xs border border-zinc-200">
                        {mod.displayName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/profiles/${mod.username}`}
                          className="text-xs font-semibold text-zinc-800 hover:underline block transition"
                        >
                          {mod.displayName}
                        </Link>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          @{mod.username}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-800 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                      Mod
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Helpful Resources */}
            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Community Charter
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-sans">
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
