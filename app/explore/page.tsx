/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Compass,
  TrendingUp,
  Users,
  Layers,
  ArrowUpRight,
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
  isFollowing: boolean;
}

const TRENDING_TOPICS: TrendingTopic[] = [
  { tag: "DesignSystems", count: 482, category: "Design" },
  { tag: "AutonomousAgents", count: 395, category: "AI & ML" },
  { tag: "NextJS15", count: 310, category: "Engineering" },
  { tag: "WebGL", count: 240, category: "Creative Tech" },
  { tag: "IndieHacker", count: 188, category: "Founders" },
  { tag: "DistributedSystems", count: 165, category: "Engineering" },
];

const FEATURED_CREATORS: Creator[] = [
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
    <div className="min-h-screen bg-[#FCFBF9] text-[#18181B] pb-20">
      {/* Top Hero Banner */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore the Platform</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#09090B] tracking-tight">
              Discover Craft, Creators & Breakthroughs
            </h1>
            <p className="text-zinc-600 text-sm sm:text-base mt-2">
              Browse trending discussions, inspect peer projects, and follow
              world-class builders pushing the boundaries of web craft.
            </p>

            {/* Search Input */}
            <div className="relative mt-6">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (#DesignSystems), creators (@alex), or keywords..."
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white border border-[#E4E4E7] focus:border-zinc-900 rounded-2xl text-sm text-[#09090B] placeholder-zinc-400 focus:outline-none transition"
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
                      ? "bg-[#09090B] text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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
              <h2 className="font-heading text-lg font-bold text-[#09090B] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-zinc-900" />
                Trending Topics & Technologies
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                Updated live
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredTopics.map((item) => (
                <Link
                  key={item.tag}
                  href={`/explore?q=${item.tag}`}
                  className="bg-white p-4 rounded-2xl border border-[#E4E4E7] hover:border-zinc-900 transition group text-left block"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {item.category}
                  </span>
                  <h3 className="font-heading font-bold text-sm text-[#09090B] group-hover:text-zinc-600 transition truncate mt-1">
                    #{item.tag}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1">
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
                <h2 className="font-heading text-lg font-bold text-[#09090B] flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-900" />
                  Featured Creators Spotlight
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Connect with active builders across design, systems, and AI.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-white rounded-3xl border border-[#E4E4E7] overflow-hidden transition hover:border-zinc-900 flex flex-col"
                >
                  {/* Cover */}
                  <div className="h-28 w-full overflow-hidden bg-zinc-900 relative">
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
                        className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white bg-white"
                      />
                      <button
                        onClick={() => toggleFollow(creator.username)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                          creator.isFollowing
                            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            : "bg-[#09090B] text-white hover:bg-zinc-800"
                        }`}
                      >
                        {creator.isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>

                    <Link
                      href={`/profiles/${creator.username}`}
                      className="font-heading font-bold text-[#09090B] text-base hover:text-zinc-600 transition"
                    >
                      {creator.displayName}
                    </Link>
                    <span className="text-xs text-zinc-400 font-mono">
                      @{creator.username}
                    </span>

                    <p className="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
                      {creator.role}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#E4E4E7] flex flex-wrap gap-1.5">
                      {creator.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-medium text-zinc-700"
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
                <h2 className="font-heading text-lg font-bold text-[#09090B] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-zinc-900" />
                  Trending Project Showcases
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  High-craft demos and prototypes built by the POPPIN community.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SHOWCASE_POSTS.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-[#E4E4E7] overflow-hidden hover:border-zinc-900 transition group flex flex-col"
                >
                  <div className="h-44 w-full overflow-hidden bg-zinc-100 relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-zinc-900 shadow-xs flex items-center gap-1.5 border border-[#E4E4E7]">
                      <span>{post.likes} likes</span>
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
                          className="text-xs font-semibold text-zinc-700 hover:text-zinc-900"
                        >
                          {post.creator}
                        </Link>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-[#09090B] group-hover:text-zinc-600 transition leading-snug">
                        {post.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E4E4E7] flex items-center justify-between text-xs text-zinc-500">
                      <span>{post.comments} comments</span>
                      <Link
                        href={`/profiles/${post.username}`}
                        className="inline-flex items-center gap-1 font-semibold text-[#09090B] hover:text-zinc-600 transition"
                      >
                        View Project
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
        <div className="p-12 text-center text-xs text-zinc-400">
          Loading explore...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
