"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe2,
  ChevronDown,
} from "lucide-react";

export function FooterBlurple() {
  const [language, setLanguage] = useState("English (US)");

  return (
    <footer className="relative w-full bg-[#070914] border-t border-white/10 pt-20 pb-12 overflow-hidden text-left">
      {/* 1. Giant Background Watermark Brand Typography */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none font-heading font-black text-[130px] sm:text-[220px] md:text-[300px] text-white/[0.025] leading-none whitespace-nowrap tracking-tighter"
        aria-hidden="true"
      >
        POPPIN
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-6 lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-[#8A9BFF] flex items-center justify-center shadow-lg shadow-[#5865F2]/30">
                <span className="font-heading font-black text-white text-base">P</span>
              </div>
              <span className="font-heading text-2xl font-black tracking-tight text-white">
                POPPIN<span className="text-[#5865F2]">.</span>
              </span>
            </Link>

            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              An immersive digital universe for builders, designers, and systems architects.
              Hang out in guild channels, share breakthroughs, and collaborate with zero lag.
            </p>

            {/* Language Selector Dropdown */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                <Globe2 className="w-3.5 h-3.5 text-[#8A9BFF]" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="English (US)" className="bg-[#0B0E1B] text-white">
                    English (US)
                  </option>
                  <option value="Español" className="bg-[#0B0E1B] text-white">
                    Español
                  </option>
                  <option value="Français" className="bg-[#0B0E1B] text-white">
                    Français
                  </option>
                  <option value="Deutsch" className="bg-[#0B0E1B] text-white">
                    Deutsch
                  </option>
                  <option value="日本語" className="bg-[#0B0E1B] text-white">
                    日本語
                  </option>
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Navigation Column 1: Product */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A9BFF]">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/explore" className="hover:text-white transition">
                  Discovery Hub
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-white transition">
                  Social Timeline
                </Link>
              </li>
              <li>
                <Link href="/messages" className="hover:text-white transition">
                  Direct Messages
                </Link>
              </li>
              <li>
                <Link href="/communities" className="hover:text-white transition">
                  Guild Channels
                </Link>
              </li>
              <li>
                <span className="text-zinc-600">Voice Lounges (Beta)</span>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Communities */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A9BFF]">
              Communities
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/communities/design-craft" className="hover:text-white transition">
                  Design Craft
                </Link>
              </li>
              <li>
                <Link href="/communities/distributed-systems" className="hover:text-white transition">
                  Distributed Systems
                </Link>
              </li>
              <li>
                <Link href="/communities/generative-agents" className="hover:text-white transition">
                  Generative Agents
                </Link>
              </li>
              <li>
                <Link href="/communities/indie-founders" className="hover:text-white transition">
                  Indie Founders
                </Link>
              </li>
              <li>
                <Link href="/communities" className="hover:text-white transition">
                  Browse All Hubs
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Resources */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A9BFF]">
              Resources
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/communities" className="hover:text-white transition">
                  Guidelines
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white transition">
                  Creator Playbook
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white transition">
                  Moderator Tools
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  Privacy Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 4: Legal & Policies */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A9BFF]">
              Policies
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  Cookie Settings
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  Safety Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} POPPIN Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold transition shadow-md shadow-[#5865F2]/20"
            >
              Open POPPIN
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
