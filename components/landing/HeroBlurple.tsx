"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowRight,
  Compass,
  Flame,
  Radio,
  CheckCircle2,
  Code2,
} from "lucide-react";

export function HeroBlurple() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const floatingCardLeft = useRef<HTMLDivElement>(null);
  const floatingCardRight = useRef<HTMLDivElement>(null);
  const floatingPill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Entrance Stagger
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", {
        opacity: 0,
        y: -15,
        duration: 0.6,
      })
        .from(
          ".hero-title-line",
          {
            opacity: 0,
            y: 28,
            duration: 0.8,
            stagger: 0.12,
          },
          "-=0.3"
        )
        .from(
          ".hero-subtitle",
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
          },
          "-=0.4"
        )
        .from(
          ".hero-cta-group",
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
          },
          "-=0.3"
        )
        .from(
          ".hero-illustration",
          {
            opacity: 0,
            scale: 0.95,
            y: 30,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.5"
        );

      // 2. Continuous Floating Idle Parallax for Floating 3D Cards
      if (floatingCardLeft.current) {
        gsap.to(floatingCardLeft.current, {
          y: -14,
          rotation: -2,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (floatingCardRight.current) {
        gsap.to(floatingCardRight.current, {
          y: 16,
          rotation: 3,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.5,
        });
      }

      if (floatingPill.current) {
        gsap.to(floatingPill.current, {
          y: -10,
          x: 6,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center items-center pt-8 pb-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-center"
    >
      {/* Top Atmosphere Pill */}
      <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-xs font-bold tracking-wide text-[#8A9BFF] mb-6 shadow-lg shadow-[#5865F2]/20 transition cursor-default">
        <span className="w-2 h-2 rounded-full bg-[#8A9BFF] animate-pulse" />
        <span>WHERE CRAFT MEETS REAL-TIME CONVERSATION</span>
      </div>

      {/* Main Uppercase Memorable Headline */}
      <h1
        ref={titleRef}
        className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-5xl leading-[1.05] sm:leading-[1.02]"
      >
        <span className="hero-title-line block">IMAGINE A PLACE...</span>
        <span className="hero-title-line block bg-gradient-to-r from-white via-[#8A9BFF] to-[#5865F2] bg-clip-text text-transparent mt-1">
          WHERE IDEAS POP.
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="hero-subtitle text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mt-6 leading-relaxed font-sans">
        A vibrant digital universe for designers, distributed systems engineers, and
        creative builders. Hang out in persistent guild channels, share breakthrough demos,
        and collaborate with zero lag.
      </p>

      {/* Dual Primary Call-to-Action Buttons */}
      <div className="hero-cta-group flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full sm:w-auto">
        <Link
          href="/register"
          className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm sm:text-base font-black tracking-wide shadow-xl shadow-[#5865F2]/40 hover:shadow-[#5865F2]/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
        >
          <span>Get Started — It&apos;s Free</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/explore"
          className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1A1F45]/80 hover:bg-[#1A1F45] text-white border border-white/20 hover:border-white/30 backdrop-blur-md text-sm sm:text-base font-bold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Compass className="w-4 h-4 text-[#8A9BFF]" />
          <span>Explore Communities</span>
        </Link>
      </div>

      {/* 3D Illustrated Composition: Realistic POPPIN UI World */}
      <div className="hero-illustration relative w-full max-w-5xl mt-12 sm:mt-16">
        {/* Ambient Backlight Behind Showcase */}
        <div
          className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-80 rounded-full opacity-70 blur-[100px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(88,101,242,0.7) 0%, rgba(44,84,234,0.3) 50%, transparent 80%)",
          }}
        />

        {/* Central Master Community Frame */}
        <div className="relative rounded-[32px] sm:rounded-[40px] bg-gradient-to-b from-[#181D40]/90 to-[#0F132B]/95 border border-white/15 p-3 sm:p-5 shadow-2xl backdrop-blur-2xl">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EB459E]/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>poppin.network • #design-craft • 1,420 members online</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
              <span>v2.5</span>
            </div>
          </div>

          {/* Inner Mockup: Guild UI Grid */}
          <div className="grid grid-cols-12 gap-3 mt-3 text-left">
            {/* Left Column: Channels List */}
            <div className="hidden md:block md:col-span-3 bg-[#0B0E1B]/70 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="font-heading text-xs font-bold text-white tracking-wide">
                  Design Guild
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="space-y-1 text-xs">
                <div className="px-2.5 py-1.5 rounded-xl bg-[#5865F2]/20 text-white font-semibold flex items-center gap-2">
                  <span className="text-[#8A9BFF]">#</span>
                  <span>general-chat</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
                  <span>#</span>
                  <span>showcase-demos</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
                  <span>#</span>
                  <span>figma-tokens</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
                  <span>#</span>
                  <span>code-review</span>
                </div>
              </div>

              {/* Voice Channel Preview */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 px-2">
                  Voice Channels
                </div>
                <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Lounge (3)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Connected</span>
                </div>
              </div>
            </div>

            {/* Center Column: Live Conversation Stream */}
            <div className="col-span-12 md:col-span-6 bg-[#0B0E1B]/70 rounded-2xl p-4 border border-white/5 flex flex-col justify-between min-h-[280px]">
              <div className="space-y-3.5">
                {/* Message 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    AR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Alex Rivera</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#5865F2]/30 text-[9px] font-bold text-[#8A9BFF]">
                        FOUNDER
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">12:44 PM</span>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                      Just pushed the new WebGL micro-interaction physics to production! Check
                      the fluid gesture feedback 🚀
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                      <span>🔥 34</span>
                      <span>❤️ 18</span>
                      <span>🚀 56</span>
                    </div>
                  </div>
                </div>

                {/* Message 2: Code Snippet */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    SC
                  </div>
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Sarah Chen</span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px] font-bold text-cyan-300">
                        ARCHITECT
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">12:45 PM</span>
                    </div>
                    <div className="mt-1.5 p-2.5 rounded-xl bg-[#070913] border border-white/10 font-mono text-[11px] text-zinc-300">
                      <span className="text-purple-400">const</span> socket ={" "}
                      <span className="text-[#8A9BFF]">io</span>(
                      <span className="text-emerald-400">&apos;https://poppin.network&apos;</span>);
                      <br />
                      socket.<span className="text-amber-300">emit</span>(
                      <span className="text-emerald-400">&apos;message:send&apos;</span>, payload);
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Placeholder */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-xs text-zinc-400">
                <span>Message #general-chat...</span>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Code2 className="w-4 h-4 hover:text-white transition" />
                  <Radio className="w-4 h-4 text-[#8A9BFF]" />
                </div>
              </div>
            </div>

            {/* Right Column: Active Members */}
            <div className="hidden md:block md:col-span-3 bg-[#0B0E1B]/70 rounded-2xl p-3 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 block">
                Online Members (42)
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                      A
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0E1B]" />
                  </div>
                  <span className="font-semibold text-zinc-200 truncate">Alex Rivera</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center text-[10px] font-bold">
                      S
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0E1B]" />
                  </div>
                  <span className="font-semibold text-zinc-200 truncate">Sarah Chen</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-[10px] font-bold">
                      M
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0E1B]" />
                  </div>
                  <span className="font-semibold text-zinc-200 truncate">Marcus Vance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Accent Card Left */}
        <div
          ref={floatingCardLeft}
          className="hidden lg:flex absolute -left-12 top-1/3 -translate-y-1/2 p-4 rounded-3xl bg-[#161B3D]/95 border border-white/20 shadow-2xl backdrop-blur-xl flex-col items-start gap-2 max-w-[210px] text-left z-20 pointer-events-none"
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Latency Benchmark
          </span>
          <h4 className="font-heading text-sm font-bold text-white">42ms Ping</h4>
          <p className="text-[11px] text-zinc-300">
            Real-time delivery over persistent WebSocket connection.
          </p>
        </div>

        {/* Floating Accent Card Right */}
        <div
          ref={floatingCardRight}
          className="hidden lg:flex absolute -right-12 bottom-12 p-4 rounded-3xl bg-[#1D173E]/95 border border-[#EB459E]/30 shadow-2xl backdrop-blur-xl flex-col items-start gap-2 max-w-[220px] text-left z-20 pointer-events-none"
        >
          <div className="p-2 rounded-xl bg-[#EB459E]/20 text-[#EB459E]">
            <Flame className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#EB459E]">
            Trending Guild
          </span>
          <h4 className="font-heading text-sm font-bold text-white">#generative-agents</h4>
          <p className="text-[11px] text-zinc-300">
            18 active discussions & prototype reviews in the last hour.
          </p>
        </div>

        {/* Floating Micro Pill */}
        <div
          ref={floatingPill}
          className="hidden sm:flex absolute -top-5 right-16 px-4 py-2 rounded-full bg-[#5865F2] text-white text-xs font-bold shadow-xl shadow-[#5865F2]/40 z-20 items-center gap-2 pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Socket.IO 4.x Connected</span>
        </div>
      </div>
    </section>
  );
}
