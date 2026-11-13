"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

interface CommunitySpotlight {
  slug: string;
  name: string;
  category: string;
  description: string;
  membersCount: number;
  onlineCount: number;
  tags: string[];
  gradient: string;
}

const FEATURED_COMMUNITIES: CommunitySpotlight[] = [
  {
    slug: "design-craft",
    name: "Design Craft & Systems",
    category: "Design",
    description:
      "A collective of product designers crafting tokenized design systems, fluid micro-interactions, and WebGL animations.",
    membersCount: 1420,
    onlineCount: 384,
    tags: ["Figma", "DesignSystems", "Tokens", "MicroInteractions"],
    gradient: "from-[#5865F2] to-[#8A9BFF]",
  },
  {
    slug: "distributed-systems",
    name: "Distributed Systems & Cloud",
    category: "Engineering",
    description:
      "Architects building low-latency backends, event brokers, consensus protocols, and resilient cloud infrastructure.",
    membersCount: 2180,
    onlineCount: 612,
    tags: ["NextJS", "Rust", "Neon", "SocketIO", "Concurrency"],
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    slug: "generative-agents",
    name: "Generative Agents & Tool Loops",
    category: "AI & ML",
    description:
      "Engineers exploring multi-agent workflows, autonomous subroutines, prompt chaining, and local LLM fine-tuning.",
    membersCount: 1890,
    onlineCount: 450,
    tags: ["Agents", "Gemini", "MCP", "RAG", "Automation"],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    slug: "indie-founders",
    name: "Indie Founders & Builders",
    category: "Founders",
    description:
      "Solo founders and early teams sharing MRR milestones, launch playbooks, customer retention insights, and candid postmortems.",
    membersCount: 980,
    onlineCount: 210,
    tags: ["Bootstrap", "MRR", "BuildInPublic", "SaaS"],
    gradient: "from-amber-400 to-orange-500",
  },
];

export function CommunityDiscoverySection() {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunitySpotlight>(
    FEATURED_COMMUNITIES[0]
  );
  const [joinedSlugs, setJoinedSlugs] = useState<string[]>(["design-craft"]);

  const toggleJoin = (slug: string) => {
    setJoinedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Outer Asymmetrical Rounded Frame */}
      <div className="relative rounded-[36px] sm:rounded-[48px] bg-gradient-to-br from-[#121633]/90 via-[#0E1229]/95 to-[#161B42]/90 border border-white/10 p-6 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Subtle Ambient Radial Lighting within Container */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-40 blur-[130px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(88,101,242,0.8) 0%, rgba(235,69,158,0.3) 60%, transparent 80%)",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Oversized Display Typography & Narrative */}
          <div className="lg:col-span-5 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30 text-xs font-bold text-[#8A9BFF]">
              <Compass className="w-4 h-4 text-[#8A9BFF]" />
              <span>DISCOVERY ENGINE</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
              CREATE AN INVITE-ONLY SPACE OR DISCOVER THE WORLD.
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              POPPIN communities are organized into dedicated hubs where you can
              collaborate, share high-res showcases, participate in threaded discussions,
              and hang out in low-latency voice and chat channels.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/communities"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 transition-all active:scale-95"
              >
                <span>Browse All Communities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Zero algorithmic gatekeeping</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contrasting Inner Preview Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#080B18]/90 border border-white/10 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
              {/* Header Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none border-b border-white/10">
                {FEATURED_COMMUNITIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setSelectedCommunity(c)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCommunity.slug === c.slug
                        ? "bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/30"
                        : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    #{c.slug}
                  </button>
                ))}
              </div>

              {/* Selected Community Live Card Showcase */}
              <div className="mt-6 space-y-5 text-left">
                {/* Banner & Brand */}
                <div className="relative rounded-2xl overflow-hidden p-6 bg-gradient-to-r from-[#171C40] to-[#121633] border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${selectedCommunity.gradient} flex items-center justify-center font-heading font-black text-xl text-white shadow-lg`}
                      >
                        #
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                            {selectedCommunity.name}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-xs font-mono text-[#8A9BFF]">
                          poppin.network/communities/{selectedCommunity.slug}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleJoin(selectedCommunity.slug)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                        joinedSlugs.includes(selectedCommunity.slug)
                          ? "bg-white/10 text-emerald-300 border border-emerald-400/30"
                          : "bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-md shadow-[#5865F2]/30"
                      }`}
                    >
                      {joinedSlugs.includes(selectedCommunity.slug) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </>
                      ) : (
                        <span>Join Space</span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 mt-4 leading-relaxed">
                    {selectedCommunity.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selectedCommunity.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Metrics Bar */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <strong className="text-white">{selectedCommunity.membersCount}</strong> members
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <strong className="text-emerald-400">{selectedCommunity.onlineCount}</strong> online
                      </span>
                    </div>

                    <Link
                      href={`/communities/${selectedCommunity.slug}`}
                      className="text-[#8A9BFF] hover:text-white transition flex items-center gap-1 font-sans font-bold"
                    >
                      <span>Enter Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
