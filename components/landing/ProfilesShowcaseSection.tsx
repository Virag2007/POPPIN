"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";

const CREATORS = [
  {
    username: "alex_design",
    displayName: "Alex Rivera",
    role: "Principal Product Designer & Hub Founder",
    followers: 1420,
    tags: ["Figma", "Design Systems", "Micro-Interactions"],
    showcaseTitle: "Hyperflow: Physical Gesture Dynamics for WebGL",
    gradient: "from-purple-500 to-indigo-600",
    initials: "AR",
  },
  {
    username: "sarah_code",
    displayName: "Sarah Chen",
    role: "Distributed Systems & Next.js Architect",
    followers: 2180,
    tags: ["Rust", "Next.js", "Concurrency", "Socket.IO"],
    showcaseTitle: "Zero-Latency Token Streaming with Backpressure",
    gradient: "from-cyan-500 to-blue-600",
    initials: "SC",
  },
  {
    username: "marcus_ai",
    displayName: "Marcus Vance",
    role: "ML Researcher & Agent Architect",
    followers: 1890,
    tags: ["Agents", "LLMs", "Tool Calling", "MCP"],
    showcaseTitle: "Parallel Agent Subroutines on an Infinite Canvas",
    gradient: "from-[#5865F2] to-purple-600",
    initials: "MV",
  },
];

export function ProfilesShowcaseSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30 text-xs font-bold text-[#8A9BFF] mb-3">
            <Users className="w-4 h-4 text-[#8A9BFF]" />
            <span>AUTHENTIC BUILDER IDENTITIES</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
            RELIABLE TECH FOR STAYING CLOSE.
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Low-latency voice and video makes it feel like you’re in the same room. Wave hello
            over video, watch friends stream their games, or gather up and have a drawing session with
            screen share.
          </p>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8A9BFF] hover:text-white transition whitespace-nowrap"
        >
          <span>Meet Active Creators</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Stylized Creator Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CREATORS.map((creator) => (
          <div
            key={creator.username}
            className="rounded-3xl bg-gradient-to-b from-[#13173A]/90 to-[#0A0D1F]/95 border border-white/10 p-6 shadow-2xl backdrop-blur-xl hover:border-[#5865F2]/50 hover:shadow-2xl hover:shadow-[#5865F2]/20 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Creator Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${creator.gradient} flex items-center justify-center font-bold text-white text-base shadow-lg`}
                  >
                    {creator.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading text-sm font-bold text-white group-hover:text-[#8A9BFF] transition">
                        {creator.displayName}
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      @{creator.username}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                  Online
                </span>
              </div>

              <p className="text-xs text-zinc-300 mt-4 leading-relaxed line-clamp-2">
                {creator.role}
              </p>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {creator.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-zinc-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Pinned Showcase Snippet */}
              <div className="mt-5 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A9BFF] block">
                  Pinned Showcase
                </span>
                <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">
                  {creator.showcaseTitle}
                </h4>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono">
                <strong className="text-white">{creator.followers}</strong> followers
              </span>

              <Link
                href={`/profiles/${creator.username}`}
                className="text-xs font-bold text-[#8A9BFF] hover:text-white transition flex items-center gap-1"
              >
                <span>View Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
