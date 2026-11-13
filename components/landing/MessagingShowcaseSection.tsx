"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Smile,
  ImageIcon,
  Paperclip,
  Send,
  CheckCheck,
  Zap,
  Flame,
  Rocket,
  Heart,
} from "lucide-react";

interface ReactionState {
  heart: number;
  fire: number;
  rocket: number;
  zap: number;
}

export function MessagingShowcaseSection() {
  const [reactions, setReactions] = useState<ReactionState>({
    heart: 24,
    fire: 48,
    rocket: 62,
    zap: 19,
  });

  const toggleReaction = (key: keyof ReactionState) => {
    setReactions((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
    }));
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Outer Card with Radial Blurple Backlight */}
      <div className="relative rounded-[36px] sm:rounded-[48px] bg-gradient-to-bl from-[#151A3E]/90 via-[#0B0E1B]/95 to-[#13173A]/90 border border-white/10 p-6 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Glow Orb */}
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-35 blur-[140px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(88,101,242,0.85) 0%, rgba(44,84,234,0.4) 60%, transparent 80%)",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Interactive Realistic Chat Window Demonstration */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-3xl bg-[#080B18]/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl text-left">
              {/* Chat Window Top Bar */}
              <div className="px-5 py-3.5 bg-[#0E1229]/80 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#8A9BFF] font-bold text-lg">#</span>
                  <div>
                    <h4 className="font-heading text-xs font-bold text-white flex items-center gap-2">
                      <span>production-ship-room</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                        LIVE
                      </span>
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      Real-time Socket.IO 4.x • Room ID: conv_4892
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono">14 Connected</span>
                </div>
              </div>

              {/* Chat Message Scrollable Viewport */}
              <div className="p-5 space-y-4 max-h-[380px] overflow-y-auto">
                {/* Message 1: Text & Profile */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                    AR
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Alex Rivera</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#5865F2]/25 text-[9px] font-bold text-[#8A9BFF]">
                        FOUNDER
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">1:12 PM</span>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                      Just tested the multi-device message sync. Opened Chrome on desktop and
                      Safari on iPhone—delivered simultaneously in under 50ms with zero duplicate
                      inserts!
                    </p>

                    {/* Interactive Reactions Bar */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleReaction("fire")}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-[11px]">{reactions.fire}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleReaction("rocket")}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                      >
                        <Rocket className="w-3.5 h-3.5 text-[#8A9BFF]" />
                        <span className="font-bold text-[11px]">{reactions.rocket}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleReaction("zap")}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="font-bold text-[11px]">{reactions.zap}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleReaction("heart")}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span className="font-bold text-[11px]">{reactions.heart}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message 2: Attachment Media */}
                <div className="flex items-start gap-3.5 pt-1">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                    SC
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Sarah Chen</span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/25 text-[9px] font-bold text-cyan-300">
                        ARCHITECT
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">1:14 PM</span>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1">
                      Here is the latency benchmark graph across 10,000 socket events:
                    </p>

                    {/* Media Mockup Card */}
                    <div className="mt-2.5 relative rounded-2xl overflow-hidden bg-[#121633] border border-white/15 p-4 max-w-sm">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] font-mono text-zinc-400">
                        <span>benchmark-latency-run.svg</span>
                        <span className="text-emerald-400 font-bold">P99: 48ms</span>
                      </div>
                      <div className="h-20 w-full rounded-xl bg-gradient-to-r from-[#5865F2]/20 to-cyan-500/20 border border-white/5 flex items-center justify-center text-xs font-mono text-[#8A9BFF]">
                        [ WebSocket Telemetry Verified ]
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typing Indicator Bubble */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-zinc-400 w-fit">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A9BFF] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A9BFF] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A9BFF] animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Marcus Vance is typing...</span>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[#0E1229]/80 border-t border-white/10">
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#080B18] border border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400 flex-1">
                    <Smile className="w-4 h-4 text-zinc-500 hover:text-white transition cursor-pointer" />
                    <span>Type your message in #production-ship-room...</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <ImageIcon className="w-4 h-4 hover:text-white transition cursor-pointer" />
                    <Paperclip className="w-4 h-4 hover:text-white transition cursor-pointer" />
                    <button
                      type="button"
                      className="p-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-md transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Showcase */}
          <div className="lg:col-span-5 text-left space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30 text-xs font-bold text-[#8A9BFF]">
              <Zap className="w-4 h-4 text-[#8A9BFF]" />
              <span>REAL-TIME ENGINE</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
              WHERE HANGING OUT IS EFFORTLESS.
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              Grab a seat in a persistent channel when you&apos;re free. Friends in your server can see
              you&apos;re around and instantly pop in to chat without having to call or schedule meetings.
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <span>Sub-100ms delivery across all active members.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#5865F2]/20 text-[#8A9BFF] flex items-center justify-center shrink-0">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <span>Rich media previews, Cloudinary assets, and code syntax highlighting.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#EB459E]/20 text-[#EB459E] flex items-center justify-center shrink-0">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <span>Multi-device synchronization with zero unread count discrepancies.</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/messages"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 transition-all active:scale-95"
              >
                <span>Try Real-Time Messaging</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
