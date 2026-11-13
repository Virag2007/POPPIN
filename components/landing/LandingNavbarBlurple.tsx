"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Users,
  PlusCircle,
  BookOpen,
  ChevronDown,
  ArrowRight,
  LogIn,
  Layers,
  MessageSquare,
  ShieldCheck,
  Code2,
  Cpu,
  Palette,
  Terminal,
  Zap,
  Radio,
  Menu,
  X,
} from "lucide-react";

export function LandingNavbarBlurple() {
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0E1B]/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] rounded-xl py-1"
          aria-label="POPPIN Home"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-[#8A9BFF] flex items-center justify-center shadow-lg shadow-[#5865F2]/30 group-hover:scale-105 transition-transform duration-300">
            <span className="font-heading font-black text-white text-lg leading-none">P</span>
          </div>
          <span className="font-heading text-2xl font-black tracking-tight text-white group-hover:text-[#8A9BFF] transition-colors">
            POPPIN<span className="text-[#5865F2]">.</span>
          </span>
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5865F2]/20 text-[#8A9BFF] border border-[#5865F2]/30 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2] animate-pulse" />
            COMMUNITY
          </span>
        </Link>

        {/* Center: Desktop Navigation Links with Mega Dropdowns */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
          {/* 1. DISCOVER DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("discover")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeDropdown === "discover"
                  ? "text-white bg-white/10 shadow-xs"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
              aria-expanded={activeDropdown === "discover"}
              onClick={() =>
                setActiveDropdown(activeDropdown === "discover" ? null : "discover")
              }
            >
              <span>Discover</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "discover" ? "rotate-180 text-[#5865F2]" : ""
                }`}
              />
            </button>

            {/* Mega Menu: Discover */}
            {activeDropdown === "discover" && (
              <div className="absolute top-full left-0 w-[580px] mt-2 p-5 rounded-3xl bg-[#10142E]/95 border border-white/10 shadow-2xl backdrop-blur-2xl grid grid-cols-12 gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="col-span-7 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9BFF] px-2 mb-2 block">
                    Featured Ecosystems
                  </span>
                  <Link
                    href="/explore"
                    className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition group"
                  >
                    <div className="p-2 rounded-xl bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/20 group-hover:scale-105 transition">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-[#8A9BFF] transition flex items-center gap-1">
                        Design Craft & Systems
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Figma components, tokens, micro-interactions & WebGL.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/explore"
                    className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition group"
                  >
                    <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1">
                        Distributed Systems
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        High-throughput concurrency, Rust, Go & event brokers.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/explore"
                    className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition group"
                  >
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition flex items-center gap-1">
                        Generative Agents & AI
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Autonomous agent architectures, tool loops & LLMs.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Right Callout Banner */}
                <div className="col-span-5 bg-gradient-to-br from-[#1A1F45] to-[#121633] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Live Community
                    </span>
                    <h5 className="font-heading text-sm font-bold text-white mt-1">
                      500+ Active Builders
                    </h5>
                    <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed">
                      Connect with product designers, AI founders, and engineers shipping in public.
                    </p>
                  </div>
                  <Link
                    href="/explore"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#8A9BFF] hover:text-white transition"
                  >
                    Browse All Hubs
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. COMMUNITIES DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("communities")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeDropdown === "communities"
                  ? "text-white bg-white/10 shadow-xs"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
              aria-expanded={activeDropdown === "communities"}
              onClick={() =>
                setActiveDropdown(activeDropdown === "communities" ? null : "communities")
              }
            >
              <span>Communities</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "communities" ? "rotate-180 text-[#5865F2]" : ""
                }`}
              />
            </button>

            {/* Mega Menu: Communities */}
            {activeDropdown === "communities" && (
              <div className="absolute top-full left-0 w-[540px] mt-2 p-5 rounded-3xl bg-[#10142E]/95 border border-white/10 shadow-2xl backdrop-blur-2xl grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <Link
                  href="/communities"
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-[#5865F2]/20 border border-white/5 hover:border-[#5865F2]/40 transition group"
                >
                  <Users className="w-5 h-5 text-[#8A9BFF] mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-[#8A9BFF] transition">
                    Browse Verified Spaces
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                    Explore curated hubs with active discussions and real-time feeds.
                  </p>
                </Link>

                <Link
                  href="/communities"
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-[#5865F2]/20 border border-white/5 hover:border-[#5865F2]/40 transition group"
                >
                  <PlusCircle className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                    Create a Community
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                    Set up your dedicated guild with custom channels and role tiers.
                  </p>
                </Link>

                <Link
                  href="/communities"
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-[#5865F2]/20 border border-white/5 hover:border-[#5865F2]/40 transition group"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                    Moderator Toolkit
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                    Guidelines enforcement, member badges, audit logs and permissions.
                  </p>
                </Link>

                <Link
                  href="/communities"
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-[#5865F2]/20 border border-white/5 hover:border-[#5865F2]/40 transition group"
                >
                  <Radio className="w-5 h-5 text-[#EB459E] mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-[#EB459E] transition">
                    Show & Tell Feeds
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                    Pin demos, gather feedback, and iterate with fellow builders.
                  </p>
                </Link>
              </div>
            )}
          </div>

          {/* 3. FEATURES DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("features")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeDropdown === "features"
                  ? "text-white bg-white/10 shadow-xs"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
              aria-expanded={activeDropdown === "features"}
              onClick={() =>
                setActiveDropdown(activeDropdown === "features" ? null : "features")
              }
            >
              <span>Features</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "features" ? "rotate-180 text-[#5865F2]" : ""
                }`}
              />
            </button>

            {/* Mega Menu: Features */}
            {activeDropdown === "features" && (
              <div className="absolute top-full left-0 w-[580px] mt-2 p-5 rounded-3xl bg-[#10142E]/95 border border-white/10 shadow-2xl backdrop-blur-2xl grid grid-cols-12 gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="col-span-7 space-y-2">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition">
                    <div className="p-2 rounded-xl bg-[#5865F2]/20 text-[#5865F2]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Sub-100ms Socket.IO Chat
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Independent WebSocket server with heartbeat and delivery guarantees.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Four Dynamic Post Types
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Updates, Project Showcases, Achievements, and Looking-for prompts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition">
                    <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Threaded Conversations & Media
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Direct 1:1 DMs, group channels, image attachments, and typing indicators.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-5 bg-[#5865F2]/10 border border-[#5865F2]/20 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9BFF]">
                      Architecture
                    </span>
                    <h5 className="font-heading text-sm font-bold text-white mt-1">
                      Engineered for Craft
                    </h5>
                    <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed">
                      Built on Next.js 15.5, React 19, Socket.IO 4.x, and Neon PostgreSQL.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Realtime server: 0.0.0.0:4000
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. RESOURCES DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("resources")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeDropdown === "resources"
                  ? "text-white bg-white/10 shadow-xs"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
              aria-expanded={activeDropdown === "resources"}
              onClick={() =>
                setActiveDropdown(activeDropdown === "resources" ? null : "resources")
              }
            >
              <span>Resources</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "resources" ? "rotate-180 text-[#5865F2]" : ""
                }`}
              />
            </button>

            {/* Mega Menu: Resources */}
            {activeDropdown === "resources" && (
              <div className="absolute top-full left-0 w-[420px] mt-2 p-4 rounded-3xl bg-[#10142E]/95 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <Link
                  href="/communities"
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition group"
                >
                  <BookOpen className="w-4 h-4 text-[#8A9BFF] group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#8A9BFF] transition">
                      Community Guidelines
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Standard operating principles for respectful, high-craft spaces.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/explore"
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition group"
                >
                  <Code2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                      API & Real-Time Protocol
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Explore REST endpoints and Socket.IO event documentation.
                    </p>
                  </div>
                </Link>

                <div className="pt-2 mt-1 border-t border-white/10 px-3 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>System Status</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    All Systems Normal
                  </span>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Action Controls (Login / Get Started) */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold tracking-wide transition-all duration-200 shadow-lg shadow-[#5865F2]/30 active:scale-95"
            >
              <span>Open POPPIN</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:text-white hover:bg-white/10 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                <span>Log In</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold tracking-wide transition-all duration-200 shadow-lg shadow-[#5865F2]/30 active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-6 bg-[#0B0E1B]/95 border-b border-white/10 backdrop-blur-2xl space-y-4">
          <div className="space-y-1">
            <Link
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              <span>Discover</span>
              <Compass className="w-4 h-4 text-[#8A9BFF]" />
            </Link>
            <Link
              href="/communities"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              <span>Communities</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link
              href="/feed"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              <span>Features</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </Link>
            <Link
              href="/communities"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              <span>Resources</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </Link>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {!user && (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-bold rounded-xl text-white bg-white/10 hover:bg-white/15 transition"
              >
                Log In
              </Link>
            )}
            <Link
              href={user ? "/feed" : "/register"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold rounded-xl text-white bg-[#5865F2] hover:bg-[#4752C4] shadow-md transition"
            >
              {user ? "Open POPPIN" : "Get Started"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
