/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FeedTabs, FeedType, FeedList } from "@/components/feed";
import { PostComposer } from "@/components/posts/post-composer";
import { PostResponse, SuggestionItem } from "@/types";
import {
  Sparkles,
  Layers,
  Users,
  TrendingUp,
} from "lucide-react";

const SUGGESTED_CREATORS: SuggestionItem[] = [
  {
    userId: "alex_design",
    username: "alex_design",
    displayName: "Alex Rivera",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    headline: "Principal Product Designer & Hub Founder",
    isFollowing: false,
  },
  {
    userId: "sarah_code",
    username: "sarah_code",
    displayName: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    headline: "Distributed Systems & Next.js Architect",
    isFollowing: true,
  },
  {
    userId: "marcus_ai",
    username: "marcus_ai",
    displayName: "Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    headline: "ML Researcher & Agent Architect",
    isFollowing: false,
  },
];

const JOINED_HUBS = [
  {
    slug: "design-craft",
    name: "Design Craft & Systems",
    avatar:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100&auto=format&fit=crop&q=80",
    members: 428,
  },
  {
    slug: "distributed-systems",
    name: "Distributed Systems",
    avatar:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop&q=80",
    members: 615,
  },
  {
    slug: "autonomous-agents",
    name: "Autonomous Agents",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    members: 389,
  },
];

export default function FeedPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedType>("for-you");
  const [latestCreatedPost, setLatestCreatedPost] =
    useState<PostResponse | null>(null);
  const [creators, setCreators] = useState<SuggestionItem[]>(SUGGESTED_CREATORS);

  // Fetch real suggestions from backend if available
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch("/api/v1/users/suggestions");
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCreators(json.data);
        }
      } catch {
        // Fallback to static suggestions
      }
    }
    fetchSuggestions();
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
      // Optimistic state kept for smooth UX
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT RAIL: User Context & Quick Navigation */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            {/* User Profile Card */}
            {user ? (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-poppin-lilac/10 text-poppin-lilac font-bold flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shrink-0">
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
                      className="font-heading font-bold text-sm text-slate-900 hover:text-poppin-lilac transition truncate block"
                    >
                      {profile?.displayName || profile?.username || "My Account"}
                    </Link>
                    <span className="text-xs text-slate-400 font-mono">
                      @{profile?.username || "creator"}
                    </span>
                  </div>
                </div>

                {profile?.headline && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {profile.headline}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <Link
                    href="/profile"
                    className="hover:text-poppin-lilac transition"
                  >
                    <strong className="text-slate-900 font-bold font-mono">
                      {profile?.followersCount || 0}
                    </strong>{" "}
                    Followers
                  </Link>
                  <Link
                    href="/profile"
                    className="hover:text-poppin-lilac transition"
                  >
                    <strong className="text-slate-900 font-bold font-mono">
                      {profile?.followingCount || 0}
                    </strong>{" "}
                    Following
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs text-center">
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Welcome to POPPIN
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Join the platform to publish showcases, comment, and connect.
                </p>
                <Link
                  href="/register"
                  className="block w-full py-2 rounded-xl bg-poppin-navy text-white text-xs font-bold shadow-xs hover:bg-poppin-navy/90 transition"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* Quick Navigation Links */}
            <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1">
              <Link
                href="/explore"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-poppin-navy transition"
              >
                <Sparkles className="w-4 h-4 text-poppin-lilac" />
                <span>Explore Trending</span>
              </Link>
              <Link
                href="/communities"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-poppin-navy transition"
              >
                <Layers className="w-4 h-4 text-poppin-lilac" />
                <span>Communities Directory</span>
              </Link>
            </div>

            {/* Joined Hubs */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                  Your Hubs
                </h4>
                <Link
                  href="/communities"
                  className="text-[11px] font-semibold text-poppin-lilac hover:underline"
                >
                  Browse
                </Link>
              </div>

              <div className="space-y-2.5">
                {JOINED_HUBS.map((hub) => (
                  <Link
                    key={hub.slug}
                    href={`/communities/${hub.slug}`}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <img
                      src={hub.avatar}
                      alt={hub.name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs text-slate-800 group-hover:text-poppin-lilac transition truncate block">
                        c/{hub.slug}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {hub.members} members
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER STREAM: Feed Composer, Tabs & Post Stream */}
          <main className="lg:col-span-6 space-y-5">
            {/* Header Title */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Community Stream
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live updates, architectural breakdowns, and project showcases.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            {/* Post Composer */}
            <PostComposer
              onPostCreated={handlePostCreated}
              token={null}
            />

            {/* Feed Navigation Tabs */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs">
              <FeedTabs
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            </div>

            {/* Post Stream */}
            <FeedList
              feedType={activeTab}
              currentUserId={user?.id}
              newPost={latestCreatedPost}
            />
          </main>

          {/* RIGHT RAIL: Creator Suggestions & Trending Topics */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            {/* Suggested Creators Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-poppin-lilac" />
                  Creators to Follow
                </h3>
              </div>

              <div className="space-y-4">
                {creators.slice(0, 3).map((creator) => (
                  <div
                    key={creator.userId}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          creator.avatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        }
                        alt={creator.displayName}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/profiles/${creator.username}`}
                          className="font-semibold text-xs text-slate-900 hover:text-poppin-lilac transition truncate block"
                        >
                          {creator.displayName}
                        </Link>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          @{creator.username}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollow(creator)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition active:scale-95 shrink-0 ${
                        creator.isFollowing
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-poppin-navy text-white hover:bg-poppin-navy/90"
                      }`}
                    >
                      {creator.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-poppin-lilac" />
                Trending Topics
              </h3>

              <div className="space-y-2.5">
                {[
                  { tag: "DesignSystems", count: 482 },
                  { tag: "AutonomousAgents", count: 395 },
                  { tag: "NextJS15", count: 310 },
                  { tag: "DistributedSystems", count: 165 },
                ].map((item) => (
                  <Link
                    key={item.tag}
                    href={`/explore?q=${item.tag}`}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <span className="font-semibold text-slate-700 group-hover:text-poppin-lilac transition">
                      #{item.tag}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.count} posts
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform Charter */}
            <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60 text-xs text-slate-500 leading-relaxed">
              <p>
                <strong>POPPIN</strong> is built for craftsmen and software
                engineers. Share real progress, benchmark results, and genuine
                insights.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
