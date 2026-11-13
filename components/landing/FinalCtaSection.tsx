"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Outer Banner */}
      <div className="relative rounded-[36px] sm:rounded-[56px] bg-gradient-to-b from-[#181D45]/90 via-[#101431]/95 to-[#0B0E1B] border border-white/15 p-8 sm:p-16 lg:p-20 text-center overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Dominant Radiant Light Flare */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-60 blur-[130px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(88,101,242,0.9) 0%, rgba(138,43,226,0.5) 45%, transparent 75%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold text-[#8A9BFF]">
            <Compass className="w-4 h-4 text-[#8A9BFF]" />
            <span>JOIN THE COMMUNITY TODAY</span>
          </div>

          <h2 className="font-heading text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05]">
            READY TO START YOUR JOURNEY?
          </h2>

          <p className="text-zinc-300 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Hang out with your friends, start discussions in guild channels, or explore
            thousands of communities building in public. It all starts on POPPIN.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm sm:text-base font-black tracking-wide shadow-2xl shadow-[#5865F2]/40 hover:shadow-[#5865F2]/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started on POPPIN</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm sm:text-base font-bold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#8A9BFF]" />
              <span>Explore Spaces</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

