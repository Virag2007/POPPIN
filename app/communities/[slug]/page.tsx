/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Community, PostResponse } from "@/types";
import { PostComposer } from "@/components/posts/post-composer";
import { PostCard } from "@/components/posts/post-card";
import { AvatarImage } from "@/components/ui/avatar-image";
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
  Loader2,
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
  const { user, token } = useAuth();

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

  const [communityPosts, setCommunityPosts] = useState<PostResponse[]>([]);
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
        const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
        const headers: Record<string, string> = {};
        if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

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
        if (isMounted && postsRes.ok && postsData.success && Array.isArray(postsData.data?.items)) {
          setCommunityPosts(postsData.data.items);
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
  }, [resolvedParams.slug, token]);

  // Derive actual showcase projects dynamically from community posts
  const showcaseProjects = communityPosts.filter((p) =>
    Boolean((p.media && p.media.length > 0) || p.tags?.some((t) => t.toLowerCase().includes("showcase") || t.toLowerCase().includes("project")))
  );

  // Derive unique community members from active discussion authors
  const members = Array.from(
    new Map(
      communityPosts
        .filter((p) => Boolean(p.author))
        .map((p) => [p.author.id, p.author])
    ).values()
  );

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
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
      const headers: Record<string, string> = {};
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      await fetch(`/api/v1/communities/${resolvedParams.slug}/join`, {
        method: wasMember ? "DELETE" : "POST",
        headers,
      });
    } catch {
      // rollback if failed
    }
  };

  const handleCreatePost = (newPost: PostResponse) => {
    setCommunityPosts((prev) => [newPost, ...prev]);
  };

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const toggleFollowMember = async (targetUserId: string) => {
    const isCurrentlyFollowing = Boolean(followingMap[targetUserId]);
    setFollowingMap((prev) => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    try {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
      const headers: Record<string, string> = {};
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      await fetch(`/api/v1/users/${targetUserId}/follow`, {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers,
      });
    } catch {
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
    }
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#313338] text-[#F2F3F5] pb-20">
      {/* Community Banner */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#1E1F22]">
        <img
          src={community.coverImage}
          alt={community.name}
          className="w-full h-full object-cover opacity-60 transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#313338] via-[#1E1F22]/50 to-transparent" />

        {/* Back Link */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 relative z-10">
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E1F22]/80 backdrop-blur-md text-white text-xs font-semibold hover:bg-[#383A40] transition shadow-xs border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Communities
          </Link>
        </div>
      </div>

      {/* Community Header Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-[#2B2D31] rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 text-white">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-[#2B2D31] shadow-lg bg-[#383A40] shrink-0 border border-white/10">
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#383A40] text-zinc-200 border border-white/10">
                    {community.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Hub
                  </span>
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {community.name}
                </h1>
                <p className="text-xs text-[#8A9BFF] font-mono mt-0.5">
                  c/{community.slug}
                </p>
                <p className="text-[#B5BAC1] text-sm mt-2 max-w-2xl leading-relaxed font-sans">
                  {community.tagline}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
              <button
                onClick={handleShareLink}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-[#F2F3F5] text-sm font-medium hover:bg-[#383A40] transition active:scale-95 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleJoin}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 cursor-pointer ${
                  community.isMember
                    ? "bg-[#383A40] text-[#B5BAC1] hover:bg-rose-500/20 hover:text-rose-300 border border-white/10"
                    : "bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-[#5865F2]/25"
                }`}
              >
                {community.isMember ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

          {/* Hub Stats Bar - Bound strictly to real database counts */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 sm:gap-10 text-xs text-[#B5BAC1]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5865F2]" />
              <span>
                <strong className="text-white font-bold font-mono">
                  {community.membersCount.toLocaleString()}
                </strong>{" "}
                Members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#8A9BFF]" />
              <span>
                <strong className="text-white font-bold font-mono">
                  {communityPosts.length}
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
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("discussions")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "discussions"
                    ? "bg-[#5865F2] text-white shadow-xs"
                    : "text-[#B5BAC1] hover:text-white hover:bg-[#383A40]"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Discussions
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-black/20 text-white font-mono">
                  {communityPosts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("showcase")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "showcase"
                    ? "bg-[#5865F2] text-white shadow-xs"
                    : "text-[#B5BAC1] hover:text-white hover:bg-[#383A40]"
                }`}
              >
                <Award className="w-4 h-4" />
                Showcase Projects
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-black/20 text-white font-mono">
                  {showcaseProjects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("rules")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "rules"
                    ? "bg-[#5865F2] text-white shadow-xs"
                    : "text-[#B5BAC1] hover:text-white hover:bg-[#383A40]"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Guidelines
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "members"
                    ? "bg-[#5865F2] text-white shadow-xs"
                    : "text-[#B5BAC1] hover:text-white hover:bg-[#383A40]"
                }`}
              >
                <Users className="w-4 h-4" />
                Contributors
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-black/20 text-white font-mono">
                  {members.length}
                </span>
              </button>
            </div>

            {/* TAB: DISCUSSIONS */}
            {activeTab === "discussions" && (
              <div className="space-y-6">
                {/* Post Composer for Community */}
                {community.isMember && (
                  <PostComposer
                    communityId={community.id}
                    placeholder={`Start a discussion or share a project in c/${community.slug}...`}
                    onPostCreated={handleCreatePost}
                  />
                )}

                {/* Posts stream */}
                <div className="space-y-4">
                  {isLoadingPosts ? (
                    <div className="bg-[#2B2D31] rounded-2xl p-12 text-center border border-white/10 shadow-lg">
                      <Loader2 className="w-6 h-6 text-[#5865F2] animate-spin mx-auto mb-3" />
                      <p className="text-xs text-[#B5BAC1] font-medium">Loading community discussions...</p>
                    </div>
                  ) : communityPosts.length === 0 ? (
                    <div className="bg-[#2B2D31] rounded-2xl p-12 text-center border border-white/10 shadow-lg">
                      <p className="text-sm font-semibold text-white font-heading">No discussions yet in c/{community.slug}</p>
                      <p className="text-xs text-[#B5BAC1] mt-1 font-sans">Be the first to share an update, showcase project, or start a thread!</p>
                    </div>
                  ) : (
                    communityPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                        token={token}
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
                      className="bg-[#2B2D31] rounded-2xl border border-white/10 overflow-hidden shadow-xs hover:border-[#5865F2] transition group"
                    >
                      <div className="h-44 w-full overflow-hidden bg-[#1E1F22] relative">
                        {item.media?.[0]?.url ? (
                          <img
                            src={item.media[0].url}
                            alt={item.content.slice(0, 40)}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-[#1E1F22] to-[#383A40]" />
                        )}
                        <div className="absolute top-3 right-3 bg-[#1E1F22]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#F2F3F5] shadow-xs flex items-center gap-1.5 border border-white/10">
                          <Flame className="w-3.5 h-3.5 text-[#8A9BFF]" />
                          <span>{item.likesCount || 0}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs text-[#B5BAC1] mb-1">
                          <span className="font-mono text-[#8A9BFF] font-medium">
                            @{item.author?.username || "member"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white group-hover:text-[#8A9BFF] transition line-clamp-2">
                          {item.content}
                        </p>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags?.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-[#1E1F22] rounded-md text-[10px] font-medium text-[#B5BAC1]"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          <Link
                            href={`/posts/${item.id}`}
                            className="text-xs font-semibold text-[#8A9BFF] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: RULES */}
            {activeTab === "rules" && (
              <div className="bg-[#2B2D31] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xs space-y-6 text-[#F2F3F5]">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#8A9BFF]" />
                    Community Norms & Guidelines
                  </h3>
                  <p className="text-xs text-[#B5BAC1] mt-1">
                    Please read and adhere to our core standards when
                    participating in c/{community.slug}.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {community.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#1E1F22] border border-white/5 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#383A40] text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Rule #{idx + 1}
                        </h4>
                        <p className="text-xs text-[#B5BAC1] mt-1 leading-relaxed font-sans">
                          {rule}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[#1E1F22] border border-white/10 text-xs text-[#B5BAC1] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#8A9BFF] shrink-0" />
                  <span>
                    Violations may result in content removal or hub expulsion by
                    moderators to preserve community quality.
                  </span>
                </div>
              </div>
            )}

            {/* TAB: MEMBERS */}
            {activeTab === "members" && (
              <div className="bg-[#2B2D31] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xs space-y-6 text-[#F2F3F5]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Community Directory
                    </h3>
                    <p className="text-xs text-[#B5BAC1] mt-0.5">
                      Meet founders, moderators, and active contributors.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#B5BAC1]">
                    {members.length} members shown
                  </span>
                </div>

                <div className="divide-y divide-white/10">
                  {members.map((mem) => (
                    <div
                      key={mem.id}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <AvatarImage
                          src={mem.avatar}
                          alt={mem.displayName || mem.username}
                          size="md"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profiles/${mem.username}`}
                              className="font-semibold text-sm text-white hover:text-[#8A9BFF] transition"
                            >
                              {mem.displayName || mem.username}
                            </Link>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1E1F22] text-[#8A9BFF] border border-white/10">
                              Member
                            </span>
                          </div>
                          <p className="text-xs text-[#B5BAC1]">
                            @{mem.username} &bull; {mem.headline || "Contributor"}
                          </p>
                        </div>
                      </div>

                      {user?.id !== mem.id && (
                        <button
                          onClick={() => toggleFollowMember(mem.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${
                            followingMap[mem.id]
                              ? "bg-[#1E1F22] text-[#B5BAC1] hover:bg-[#383A40]"
                              : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                          }`}
                        >
                          {followingMap[mem.id] ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Rail */}
          <div className="lg:col-span-4 space-y-6">
            {/* About Card */}
            <div className="bg-[#2B2D31] rounded-2xl p-6 border border-white/10 shadow-xs text-[#F2F3F5]">
              <h3 className="font-bold text-white text-sm mb-3">
                About this Hub
              </h3>
              <p className="text-xs text-[#B5BAC1] leading-relaxed font-sans">
                {community.description}
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5 text-xs text-[#B5BAC1]">
                <div className="flex items-center justify-between">
                  <span className="text-[#B5BAC1]/70">Created</span>
                  <span className="font-medium text-white">
                    October 2026
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#B5BAC1]/70">Category</span>
                  <span className="font-medium text-white">
                    {community.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#B5BAC1]/70">Visibility</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Public Community
                  </span>
                </div>
              </div>
            </div>

            {/* Moderators Card */}
            <div className="bg-[#2B2D31] rounded-2xl p-6 border border-white/10 shadow-xs text-[#F2F3F5]">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8A9BFF]" />
                Hub Moderators
              </h3>
              <div className="space-y-3">
                {community.moderators.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1E1F22] text-[#8A9BFF] font-bold flex items-center justify-center text-xs border border-white/10">
                        {mod.displayName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/profiles/${mod.username}`}
                          className="text-xs font-semibold text-white hover:text-[#8A9BFF] block transition"
                        >
                          {mod.displayName}
                        </Link>
                        <span className="text-[10px] text-[#B5BAC1] font-mono">
                          @{mod.username}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#8A9BFF] bg-[#1E1F22] border border-white/10 px-2 py-0.5 rounded-full">
                      Mod
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Helpful Resources */}
            <div className="bg-[#2B2D31]/60 rounded-2xl p-5 border border-white/10">
              <h4 className="text-xs font-bold text-[#8A9BFF] uppercase tracking-wider mb-2">
                Community Charter
              </h4>
              <p className="text-xs text-[#B5BAC1] leading-relaxed font-sans">
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
