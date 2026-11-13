"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Hash,
  Volume2,
  Lock,
  Plus,
  Check,
} from "lucide-react";

export function CommunityCreationSection() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [spaceName, setSpaceName] = useState("Autonomous AI Guild");
  const [selectedRole, setSelectedRole] = useState("Architect");

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Outer Card with Radial Atmospheric Violet/Blurple Lighting */}
      <div className="relative rounded-[36px] sm:rounded-[48px] bg-gradient-to-br from-[#161B42]/90 via-[#0D1024]/95 to-[#1A1438]/90 border border-white/10 p-6 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Glow */}
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full opacity-35 blur-[140px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(138,43,226,0.7) 0%, rgba(88,101,242,0.4) 60%, transparent 80%)",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading and Step Controls */}
          <div className="lg:col-span-5 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>CUSTOM SPACE CREATION</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
              FROM A FEW TO A FANDOM. YOUR REALM, YOUR RULES.
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              Organize any community with customizable moderation tools and custom member access.
              Give members special superpowers, set up private channels, and customize your
              environment to fit your vision.
            </p>

            {/* Stepper Selection */}
            <div className="space-y-3 pt-2">
              {[
                {
                  step: 1,
                  title: "1. Define Identity & Slug",
                  desc: "Pick your wordmark, banner, and unique permanent slug.",
                },
                {
                  step: 2,
                  title: "2. Organize Channels & Voice",
                  desc: "Structure discussions into focused topic-based channels.",
                },
                {
                  step: 3,
                  title: "3. Assign Roles & Permissions",
                  desc: "Reward active contributors with custom moderation privileges.",
                },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all ${activeStep === s.step
                      ? "bg-white/10 border-[#5865F2] shadow-lg shadow-[#5865F2]/20"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400"
                    }`}
                >
                  <h4
                    className={`font-heading text-xs sm:text-sm font-bold ${activeStep === s.step ? "text-white" : "text-zinc-300"
                      }`}
                  >
                    {s.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Live Interactive Mockup Builder */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#080B18]/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-left space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Community Studio
                  </span>
                  <h3 className="font-heading text-lg font-bold text-white mt-0.5">
                    Configure Space Blueprint
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Slug Available</span>
                </div>
              </div>

              {/* Step 1 Preview: Name & Slug */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Community Name
                    </label>
                    <input
                      type="text"
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-[#5865F2] transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Public Slug Identifier
                    </label>
                    <div className="flex items-center px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm text-zinc-400 font-mono">
                      <span>poppin.network/communities/</span>
                      <span className="text-emerald-400 font-bold">
                        {spaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-[#5865F2] flex items-center justify-center font-bold text-white text-lg shadow-md">
                      AI
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{spaceName}</h4>
                      <p className="text-[11px] text-zinc-400">
                        Default icon & banner ready. Ready to invite first 50 members.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 Preview: Channel Organization */}
              {activeStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span className="uppercase font-bold tracking-wider">Channel Categories</span>
                    <button
                      type="button"
                      className="text-[#8A9BFF] hover:text-white font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Channel
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Hash className="w-4 h-4 text-[#8A9BFF]" />
                        <span>announcements</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-zinc-300 font-mono">
                        Read Only
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Hash className="w-4 h-4 text-[#8A9BFF]" />
                        <span>showcase-demos</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                        Media Allowed
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        <span>Hacker Lounge</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                        Voice Channel
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>core-founders</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                        Role Restricted
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Preview: Roles & Permissions */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-3 gap-2">
                    {["Founder", "Architect", "Contributor"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`p-3 rounded-xl text-center border text-xs font-bold transition ${selectedRole === role
                            ? "bg-[#5865F2] border-[#5865F2] text-white shadow-md shadow-[#5865F2]/30"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Manage Guild Channels</span>
                      <span className="text-emerald-400 font-bold font-mono">ENABLED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Delete Inappropriate Messages</span>
                      <span className="text-emerald-400 font-bold font-mono">ENABLED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Pin Showcase Breakouts</span>
                      <span className="text-emerald-400 font-bold font-mono">ENABLED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/communities"
                  className="w-full py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#5865F2]/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <span>Launch Community with Template</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
