"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AvatarImage } from "@/components/ui/avatar-image";
import {
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";

interface CreatorItem {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatar: string;
  cover: string;
  followersCount: number;
  tags: string[];
}

export function ProfilesShowcaseSection() {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadCreators() {
      try {
        const res = await fetch("/api/v1/explore");
        const json = await res.json();
        if (res.ok && json.success && json.data?.featuredCreators?.length > 0) {
          setCreators(json.data.featuredCreators.slice(0, 3));
        }
      } catch (e) {
        console.error("Failed to fetch featured creators:", e);
      } finally {
        setLoaded(true);
      }
    }
    loadCreators();
  }, []);

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
            Low-latency conversation, rich profiles, and real creator communities. Share your breakthroughs,
            collaborate in specialized spaces, and build lasting professional connections.
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
        {creators.length > 0 ? (
          creators.map((creator) => (
            <div
              key={creator.username}
              className="rounded-3xl bg-gradient-to-b from-[#13173A]/90 to-[#0A0D1F]/95 border border-white/10 p-6 shadow-2xl backdrop-blur-xl hover:border-[#5865F2]/50 hover:shadow-2xl hover:shadow-[#5865F2]/20 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Creator Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-[#1E1F22]">
                      <AvatarImage
                        src={creator.avatar}
                        alt={creator.displayName}
                        size="md"
                        className="w-full h-full"
                      />
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
                    Active
                  </span>
                </div>

                <p className="text-xs text-zinc-300 mt-4 leading-relaxed line-clamp-2">
                  {creator.role}
                </p>

                {/* Tags */}
                {creator.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {creator.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-zinc-400 border border-white/5"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">
                  <strong className="text-white">{creator.followersCount}</strong> {creator.followersCount === 1 ? "follower" : "followers"}
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
          ))
        ) : loaded ? (
          <div className="col-span-full py-12 rounded-3xl bg-[#13173A]/40 border border-white/10 text-center text-sm text-zinc-400">
            Join POPPIN to become one of the first featured creators!
          </div>
        ) : (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-[#13173A]/50 border border-white/10 p-6 h-56 animate-pulse"
            />
          ))
        )}
      </div>
    </section>
  );
}
