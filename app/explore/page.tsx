/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AvatarImage } from "@/components/ui/avatar-image";
import {
  Search,
  Compass,
  TrendingUp,
  Users,
  Layers,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

interface TrendingTopic {
  tag: string;
  count: number;
  category: string;
}

interface Creator {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatar: string;
  cover: string;
  followersCount: number;
  tags: string[];
  isFollowing?: boolean;
}

interface ShowcasePost {
  id: string;
  title: string;
  creator: string;
  username: string;
  avatar: string;
  image: string;
  likes: number;
  comments: number;
  type: string;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "creators" | "projects" | "topics"
  >("all");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [showcases, setShowcases] = useState<ShowcasePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExploreData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/explore");
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setCreators(data.data.featuredCreators || []);
          setTopics(data.data.trendingTopics || []);
          setShowcases(data.data.showcasePosts || []);
        }
      } catch (err) {
        console.error("Failed to load explore data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadExploreData();
  }, []);

  const filteredTopics = topics.filter((t) =>
    t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCreators = creators.filter(
    (c) =>
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShowcases = showcases.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#313338] text-[#F2F3F5] pb-24">
      {/* Top Hero Banner */}
      <div className="bg-[#2B2D31] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5865F2]/20 text-[#8A9BFF] border border-[#5865F2]/30 text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5 text-[#8A9BFF]" />
              <span>Explore Platform</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
              Discover Craft, Creators & Breakthroughs
            </h1>
            <p className="text-[#B5BAC1] text-sm sm:text-base mt-2">
              Browse authentic discussions, inspect peer projects, and follow
              world-class builders pushing the boundaries of web craft.
            </p>

            {/* Search Input */}
            <div className="relative mt-6">
              <Search className="w-5 h-5 text-[#B5BAC1] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, creators, or keywords..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#383A40] hover:bg-[#383A40]/80 focus:bg-[#383A40] border border-white/10 focus:border-[#5865F2] rounded-2xl text-sm text-[#F2F3F5] placeholder-[#B5BAC1]/60 focus:outline-none transition shadow-inner"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: "all", label: "All" },
                { id: "creators", label: "Creators" },
                { id: "projects", label: "Project Showcases" },
                { id: "topics", label: "Trending Topics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setSelectedFilter(
                      tab.id as "all" | "creators" | "projects" | "topics"
                    )
                  }
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    selectedFilter === tab.id
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "bg-[#1E1F22] text-[#B5BAC1] hover:text-[#F2F3F5] hover:bg-[#383A40] border border-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 space-y-12">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin mb-3" />
            <p className="text-sm font-medium text-[#B5BAC1]">Loading explore highlights...</p>
          </div>
        ) : (
          <>
            {/* SECTION: TRENDING TOPICS */}
            {(selectedFilter === "all" || selectedFilter === "topics") && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#8A9BFF]" />
                    Trending Topics & Technologies
                  </h2>
                  <span className="text-xs text-[#B5BAC1] font-mono">
                    Live from database
                  </span>
                </div>

                {filteredTopics.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#2B2D31] border border-white/10 text-center text-xs text-[#B5BAC1]">
                    No trending topics recorded yet. Create posts with tags to start trending!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {filteredTopics.map((item) => (
                      <Link
                        key={item.tag}
                        href={`/explore?q=${item.tag}`}
                        className="bg-[#2B2D31] p-4 rounded-2xl border border-white/10 hover:border-[#5865F2] transition group text-left block"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9BFF]">
                          {item.category}
                        </span>
                        <h3 className="font-heading font-bold text-sm text-[#F2F3F5] group-hover:text-[#8A9BFF] transition truncate mt-1">
                          #{item.tag}
                        </h3>
                        <p className="text-[11px] text-[#B5BAC1] font-mono mt-1">
                          {item.count} {item.count === 1 ? "post" : "posts"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION: FEATURED CREATORS SPOTLIGHT */}
            {(selectedFilter === "all" || selectedFilter === "creators") && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#8A9BFF]" />
                      Featured Creators Spotlight
                    </h2>
                    <p className="text-xs text-[#B5BAC1] mt-0.5">
                      Connect with authentic builders across design, systems, and engineering.
                    </p>
                  </div>
                </div>

                {filteredCreators.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#2B2D31] border border-white/10 text-center text-xs text-[#B5BAC1]">
                    No creators found matching your query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredCreators.map((creator) => (
                      <div
                        key={creator.id}
                        className="bg-[#2B2D31] rounded-3xl border border-white/10 overflow-hidden transition hover:border-[#5865F2] flex flex-col"
                      >
                        {/* Cover */}
                        <div className="h-28 w-full overflow-hidden bg-[#1E1F22] relative">
                          {creator.cover ? (
                            <img
                              src={creator.cover}
                              alt={creator.displayName}
                              className="w-full h-full object-cover opacity-80"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-[#1E1F22] to-[#383A40]" />
                          )}
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 flex flex-col relative pt-0">
                          {/* Avatar */}
                          <div className="relative -mt-10 mb-3 flex items-end justify-between">
                            <div className="ring-4 ring-[#2B2D31] rounded-2xl overflow-hidden shadow-md">
                              <AvatarImage
                                src={creator.avatar}
                                alt={creator.displayName}
                                size="lg"
                                className="w-16 h-16 rounded-2xl"
                              />
                            </div>
                            <Link
                              href={`/profiles/${creator.username}`}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#5865F2] text-white hover:bg-[#4752C4] transition"
                            >
                              View Profile
                            </Link>
                          </div>

                          <Link
                            href={`/profiles/${creator.username}`}
                            className="font-heading font-bold text-white text-base hover:text-[#8A9BFF] transition"
                          >
                            {creator.displayName}
                          </Link>
                          <span className="text-xs text-[#B5BAC1] font-mono">
                            @{creator.username}
                          </span>

                          <p className="text-xs text-[#B5BAC1] mt-2 line-clamp-2 leading-relaxed">
                            {creator.role}
                          </p>

                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#B5BAC1]">
                            <span className="font-mono">
                              <strong className="text-white">{creator.followersCount}</strong> {creator.followersCount === 1 ? "follower" : "followers"}
                            </span>
                            {creator.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {creator.tags.slice(0, 2).map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 rounded-md bg-[#1E1F22] text-[10px] font-medium text-[#B5BAC1]"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION: SHOWCASE PROJECTS */}
            {(selectedFilter === "all" || selectedFilter === "projects") && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#8A9BFF]" />
                      Trending Project Showcases
                    </h2>
                    <p className="text-xs text-[#B5BAC1] mt-0.5">
                      Authentic prototypes and discussions published by POPPIN members.
                    </p>
                  </div>
                </div>

                {filteredShowcases.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#2B2D31] border border-white/10 text-center text-xs text-[#B5BAC1]">
                    No project showcases published yet. Share your project from the main feed!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredShowcases.map((post) => (
                      <div
                        key={post.id}
                        className="bg-[#2B2D31] rounded-3xl border border-white/10 overflow-hidden hover:border-[#5865F2] transition group flex flex-col"
                      >
                        {post.image ? (
                          <div className="h-44 w-full overflow-hidden bg-[#1E1F22] relative">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute top-3 right-3 bg-[#1E1F22]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#F2F3F5] shadow-xs flex items-center gap-1.5 border border-white/10">
                              <span>{post.likes} likes</span>
                            </div>
                          </div>
                        ) : null}

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AvatarImage
                                src={post.avatar}
                                alt={post.creator}
                                size="sm"
                                className="w-5 h-5 rounded-full"
                              />
                              <Link
                                href={`/profiles/${post.username}`}
                                className="text-xs font-semibold text-[#B5BAC1] hover:text-white"
                              >
                                {post.creator}
                              </Link>
                            </div>

                            <h3 className="font-heading font-bold text-sm text-white group-hover:text-[#8A9BFF] transition leading-snug">
                              {post.title}
                            </h3>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#B5BAC1]">
                            <span>{post.comments} comments</span>
                            <Link
                              href={`/posts/${post.id}`}
                              className="inline-flex items-center gap-1 font-semibold text-[#8A9BFF] hover:text-white transition"
                            >
                              View Post
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#313338] p-12 text-center text-xs text-[#B5BAC1]">
          Loading explore...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
