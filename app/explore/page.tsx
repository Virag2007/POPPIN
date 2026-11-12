/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Flame,
  ArrowRight,
} from "lucide-react";

const TRENDING_TOPICS = [
  { tag: "DesignSystems", count: 482, category: "Design" },
  { tag: "AutonomousAgents", count: 395, category: "AI & ML" },
  { tag: "NextJS15", count: 310, category: "Engineering" },
  { tag: "WebGL", count: 240, category: "Creative Tech" },
  { tag: "IndieHacker", count: 188, category: "Founders" },
  { tag: "DistributedSystems", count: 165, category: "Engineering" },
];

const FEATURED_CREATORS = [
  {
    id: "alex_design",
    username: "alex_design",
    displayName: "Alex Rivera",
    role: "Principal Product Designer & Hub Founder",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    followersCount: 1420,
    tags: ["Figma", "Design Systems", "Micro-Interactions"],
    isFollowing: false,
  },
  {
    id: "sarah_code",
    username: "sarah_code",
    displayName: "Sarah Chen",
    role: "Distributed Systems & Next.js Architect",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    followersCount: 2180,
    tags: ["Rust", "Next.js", "Concurrency"],
    isFollowing: true,
  },
  {
    id: "marcus_ai",
    username: "marcus_ai",
    displayName: "Marcus Vance",
    role: "ML Researcher & Agent Architect",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    cover:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    followersCount: 1890,
    tags: ["Agents", "LLMs", "Tool Calling"],
    isFollowing: false,
  },
];

const SHOWCASE_POSTS = [
  {
    id: "sh_1",
    title: "Hyperflow: Physical Gesture Dynamics for WebGL",
    creator: "Alex Rivera",
    username: "alex_design",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    likes: 248,
    comments: 32,
    type: "PROJECT_SHOWCASE",
  },
  {
    id: "sh_2",
    title: "Zero-Latency Token Streaming with Backpressure",
    creator: "Sarah Chen",
    username: "sarah_code",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    likes: 312,
    comments: 48,
    type: "ACHIEVEMENT",
  },
  {
    id: "sh_3",
    title: "Parallel Agent Subroutines on an Infinite Canvas",
    creator: "Marcus Vance",
    username: "marcus_ai",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    likes: 420,
    comments: 65,
    type: "PROJECT_SHOWCASE",
  },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "creators" | "projects" | "topics"
  >("all");
  const [creators, setCreators] = useState(FEATURED_CREATORS);
  const [topics, setTopics] = useState(TRENDING_TOPICS);

  React.useEffect(() => {
    async function loadExploreData() {
      try {
        const res = await fetch("/api/v1/explore");
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          if (data.data.featuredCreators?.length > 0) {
            setCreators(data.data.featuredCreators);
          }
          if (data.data.trendingTopics?.length > 0) {
            setTopics(data.data.trendingTopics);
          }
        }
      } catch {
        // keep defaults
      }
    }
    loadExploreData();
  }, []);

  const toggleFollow = (username: string) => {
    setCreators((prev) =>
      prev.map((c) =>
        c.username === username ? { ...c, isFollowing: !c.isFollowing } : c
      )
    );
  };

  const filteredTopics = topics.filter((t) =>
    t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCreators = creators.filter(
    (c) =>
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Hero Banner */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-poppin-lilac/10 text-poppin-lilac text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Explore the POPPIN Universe
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Discover Craft, Creators & Breakthroughs.
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Browse trending discussions, inspect peer projects, and follow
              world-class builders pushing the boundaries of web craft.
            </p>

            {/* Search Input */}
            <div className="relative mt-6">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (#DesignSystems), creators (@alex), or keywords..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-poppin-lilac rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-xs"
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
                      ? "bg-poppin-navy text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
        {/* SECTION: TRENDING TOPICS */}
        {(selectedFilter === "all" || selectedFilter === "topics") && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-poppin-lilac" />
                Trending Topics & Technologies
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Updated live
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredTopics.map((item) => (
                <Link
                  key={item.tag}
                  href={`/explore?q=${item.tag}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-poppin-lilac/40 hover:shadow-md transition group text-left block"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-poppin-lilac">
                    {item.category}
                  </span>
                  <h3 className="font-heading font-bold text-sm text-slate-900 group-hover:text-poppin-lilac transition truncate mt-1">
                    #{item.tag}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    {item.count} posts
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: FEATURED CREATORS SPOTLIGHT */}
        {(selectedFilter === "all" || selectedFilter === "creators") && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-poppin-lilac" />
                  Featured Creators Spotlight
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect with active builders across design, systems, and AI.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  {/* Cover */}
                  <div className="h-28 w-full overflow-hidden bg-slate-900 relative">
                    <img
                      src={creator.cover}
                      alt={creator.displayName}
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col relative pt-0">
                    {/* Avatar */}
                    <div className="relative -mt-10 mb-3 flex items-end justify-between">
                      <img
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                      />
                      <button
                        onClick={() => toggleFollow(creator.username)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                          creator.isFollowing
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-poppin-navy text-white hover:bg-poppin-navy/90"
                        }`}
                      >
                        {creator.isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>

                    <Link
                      href={`/profiles/${creator.username}`}
                      className="font-heading font-bold text-slate-900 text-base hover:text-poppin-lilac transition"
                    >
                      {creator.displayName}
                    </Link>
                    <span className="text-xs text-slate-400 font-mono">
                      @{creator.username}
                    </span>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {creator.role}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {creator.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: SHOWCASE PROJECTS */}
        {(selectedFilter === "all" || selectedFilter === "projects") && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Trending Project Showcases
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-craft demos and prototypes built by the POPPIN community.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SHOWCASE_POSTS.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col"
                >
                  <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>{post.likes}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={post.avatar}
                          alt={post.creator}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <Link
                          href={`/profiles/${post.username}`}
                          className="text-xs font-semibold text-slate-700 hover:text-poppin-lilac"
                        >
                          {post.creator}
                        </Link>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-slate-900 group-hover:text-poppin-lilac transition leading-snug">
                        {post.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{post.comments} comments</span>
                      <Link
                        href={`/profiles/${post.username}`}
                        className="inline-flex items-center gap-1 font-semibold text-poppin-navy hover:text-poppin-lilac transition"
                      >
                        View Project
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading explore...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

