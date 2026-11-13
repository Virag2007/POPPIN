/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FeedTabs, FeedType, FeedList } from "@/components/feed";
import { PostComposer } from "@/components/posts/post-composer";
import { PostResponse, SuggestionItem } from "@/types";
import {
  Compass,
  Layers,
  Users,
  TrendingUp,
} from "lucide-react";

interface CommunityItem {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  tagline: string | null;
  category: string;
  _count: { members: number };
}

export default function FeedPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedType>("for-you");
  const [latestCreatedPost, setLatestCreatedPost] = useState<PostResponse | null>(null);
  const [creators, setCreators] = useState<SuggestionItem[]>([]);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [isLoadingSidebars, setIsLoadingSidebars] = useState(true);

  // Fetch real suggestions and real communities from backend
  useEffect(() => {
    async function fetchSidebarData() {
      try {
        setIsLoadingSidebars(true);
        const [suggestionsRes, communitiesRes] = await Promise.all([
          fetch("/api/v1/users/suggestions"),
          fetch("/api/v1/communities?limit=5"),
        ]);

        const suggestionsJson = await suggestionsRes.json();
        if (suggestionsRes.ok && suggestionsJson.success && Array.isArray(suggestionsJson.data)) {
          setCreators(suggestionsJson.data);
        }

        const communitiesJson = await communitiesRes.json();
        if (communitiesRes.ok && communitiesJson.success && communitiesJson.data?.items) {
          setCommunities(communitiesJson.data.items);
        }
      } catch {
        // Handled silently
      } finally {
        setIsLoadingSidebars(false);
      }
    }

    fetchSidebarData();
  }, []);

  const handlePostCreated = (post: PostResponse) => {
    setLatestCreatedPost(post);
  };

  const toggleFollow = async (creator: SuggestionItem) => {
    const nextState = !creator.isFollowing;
    setCreators((prev) =>
      prev.map((c) =>
        c.userId === creator.userId ? { ...c, isFollowing: nextState } : c
      )
    );

    try {
      if (nextState) {
        await fetch(`/api/v1/users/${creator.userId}/follow`, { method: "POST" });
      } else {
        await fetch(`/api/v1/users/${creator.userId}/follow`, { method: "DELETE" });
      }
    } catch {
      // Reconcile on error
      setCreators((prev) =>
        prev.map((c) =>
          c.userId === creator.userId ? { ...c, isFollowing: !nextState } : c
        )
      );
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-[#F2F3F5]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT RAIL: User Context & Quick Navigation */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            {/* User Profile Card */}
            {user ? (
              <div className="bg-[#2B2D31] rounded-2xl p-5 border border-white/10 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#383A40] text-white font-bold flex items-center justify-center overflow-hidden border border-white/10 shrink-0 font-heading">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.displayName || profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (profile?.username || "P").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href="/profile"
                      className="font-bold text-sm text-[#F2F3F5] hover:underline truncate block font-sans"
                    >
                      {profile?.displayName || profile?.username || "My Account"}
                    </Link>
                    <span className="text-xs text-[#B5BAC1] font-mono">
                      @{profile?.username || "member"}
                    </span>
                  </div>
                </div>

                {profile?.headline && (
                  <p className="text-xs text-[#B5BAC1] line-clamp-2 leading-relaxed mb-4 font-sans">
                    {profile.headline}
                  </p>
                )}

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#B5BAC1]">
                  <Link href="/profile" className="hover:underline transition">
                    <strong className="text-white font-bold font-mono">
                      {profile?.followersCount || 0}
                    </strong>{" "}
                    Followers
                  </Link>
                  <Link href="/profile" className="hover:underline transition">
                    <strong className="text-white font-bold font-mono">
                      {profile?.followingCount || 0}
                    </strong>{" "}
                    Following
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Quick Navigation Links */}
            <div className="bg-[#2B2D31] rounded-2xl p-3 border border-white/10 shadow-lg space-y-1">
              <Link
                href="/explore"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#B5BAC1] hover:bg-[#383A40] hover:text-white transition"
              >
                <Compass className="w-4 h-4 text-[#5865F2]" />
                <span>Explore Trending</span>
              </Link>
              <Link
                href="/communities"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#B5BAC1] hover:bg-[#383A40] hover:text-white transition"
              >
                <Layers className="w-4 h-4 text-[#5865F2]" />
                <span>Communities Directory</span>
              </Link>
            </div>

            {/* Featured Communities */}
            <div className="bg-[#2B2D31] rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[#B5BAC1] font-heading">
                  Communities
                </h4>
                <Link
                  href="/communities"
                  className="text-xs font-medium text-[#5865F2] hover:underline"
                >
                  Browse
                </Link>
              </div>

              <div className="space-y-2">
                {isLoadingSidebars ? (
                  <div className="py-4 text-center text-xs text-zinc-500">Loading spaces...</div>
                ) : communities.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">No communities yet.</div>
                ) : (
                  communities.map((hub) => (
                    <Link
                      key={hub.slug}
                      href={`/communities/${hub.slug}`}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#383A40] transition group border border-transparent"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#383A40] text-white flex items-center justify-center font-bold text-xs border border-white/10 overflow-hidden shrink-0">
                        {hub.avatar ? (
                          <img src={hub.avatar} alt={hub.name} className="w-full h-full object-cover" />
                        ) : (
                          hub.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-xs text-[#F2F3F5] group-hover:underline transition truncate block">
                          c/{hub.slug}
                        </span>
                        <span className="text-[10px] text-[#B5BAC1] font-mono">
                          {hub._count?.members || 1} members
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* CENTER STREAM: Feed Composer, Tabs & Post Stream */}
          <main className="lg:col-span-6 space-y-4">
            {/* Header Title */}
            <div className="bg-[#2B2D31] rounded-2xl p-5 sm:p-6 border border-white/10 shadow-lg flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                  Community Stream
                </h1>
                <p className="text-xs text-[#B5BAC1] mt-1 font-sans">
                  Real updates, architectural breakdowns, and project showcases.
                </p>
              </div>
            </div>

            {/* Post Composer */}
            <PostComposer onPostCreated={handlePostCreated} token={null} />

            {/* Feed Navigation Tabs */}
            <div className="bg-[#2B2D31] rounded-2xl p-1.5 border border-white/10 shadow-lg">
              <FeedTabs activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
            </div>

            {/* Post Stream */}
            <FeedList feedType={activeTab} currentUserId={user?.id} newPost={latestCreatedPost} />
          </main>

          {/* RIGHT RAIL: Creator Suggestions & Trending Topics */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            {/* Suggested Creators Card */}
            <div className="bg-[#2B2D31] rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-[#B5BAC1] flex items-center gap-1.5 font-heading">
                  <Users className="w-3.5 h-3.5 text-[#5865F2]" />
                  Members to Follow
                </h3>
              </div>

              <div className="space-y-3.5">
                {isLoadingSidebars ? (
                  <div className="py-4 text-center text-xs text-zinc-500">Finding members...</div>
                ) : creators.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500 font-sans">
                    You follow everyone suggested!
                  </div>
                ) : (
                  creators.slice(0, 5).map((creator) => (
                    <div key={creator.userId} className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs border border-white/10 overflow-hidden shrink-0 font-heading">
                          {creator.avatar ? (
                            <img src={creator.avatar} alt={creator.displayName} className="w-full h-full object-cover" />
                          ) : (
                            creator.displayName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/profiles/${creator.username}`}
                            className="font-semibold text-xs text-[#F2F3F5] hover:underline truncate block"
                          >
                            {creator.displayName}
                          </Link>
                          <p className="text-[11px] text-[#B5BAC1] font-mono truncate">
                            @{creator.username}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollow(creator)}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition active:scale-95 shrink-0 ${
                          creator.isFollowing
                            ? "bg-[#383A40] text-zinc-300 hover:bg-[#313338]"
                            : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                        }`}
                      >
                        {creator.isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Trending Topics Card */}
            <div className="bg-[#2B2D31] rounded-2xl p-5 border border-white/10 shadow-lg">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#B5BAC1] mb-3 flex items-center gap-1.5 font-heading">
                <TrendingUp className="w-3.5 h-3.5 text-[#5865F2]" />
                Trending Topics
              </h3>

              <div className="space-y-2">
                {[
                  { tag: "DesignSystems", count: 42 },
                  { tag: "DistributedSystems", count: 28 },
                  { tag: "NextJS15", count: 21 },
                  { tag: "CloudArchitecture", count: 17 },
                ].map((item) => (
                  <Link
                    key={item.tag}
                    href={`/explore?q=${item.tag}`}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-[#383A40] transition group border border-transparent"
                  >
                    <span className="font-medium text-[#B5BAC1] group-hover:text-white group-hover:underline">
                      #{item.tag}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {item.count} posts
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
