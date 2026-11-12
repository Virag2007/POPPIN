"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SearchModal from "@/components/SearchModal";
import gsap from "gsap";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
  Users,
  Sparkles,
  Flame,
  Layers,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe2,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Live handle probe state
  const [handleQuery, setHandleQuery] = useState("creative_coder");
  const [probeResult, setProbeResult] = useState<{
    isAvailable?: boolean;
    reason?: string;
    loading: boolean;
  }>({ loading: false });

  // GSAP Entrance
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-badge", {
        opacity: 0,
        y: -12,
        duration: 0.5,
        ease: "power2.out",
      });
      gsap.from(".hero-title", {
        opacity: 0,
        y: 18,
        duration: 0.6,
        delay: 0.08,
        ease: "power3.out",
      });
      gsap.from(".hero-desc", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        delay: 0.16,
        ease: "power3.out",
      });
      gsap.from(".hero-search-box", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.22,
        ease: "power2.out",
      });
      gsap.from(".feature-row", {
        opacity: 0,
        y: 25,
        duration: 0.6,
        stagger: 0.08,
        delay: 0.3,
        ease: "power2.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Live handle availability checking logic
  useEffect(() => {
    if (!handleQuery.trim()) {
      setProbeResult({ loading: false });
      return;
    }

    setProbeResult((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/usernames/availability?username=${encodeURIComponent(handleQuery.trim())}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setProbeResult({
            isAvailable: data.data.isAvailable,
            reason: data.data.reason,
            loading: false,
          });
        } else {
          setProbeResult({
            isAvailable: false,
            reason: data.error?.message || "Invalid handle format",
            loading: false,
          });
        }
      } catch {
        setProbeResult({
          isAvailable: false,
          reason: "Probe failed to connect",
          loading: false,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [handleQuery]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(true);
    }
  };

  const trendingHubs = [
    {
      slug: "design-craft",
      name: "r/design-craft",
      title: "Design Systems & UI Craft",
      desc: "Pixel precision, micro-interactions, typography and frontend architecture.",
      members: "428",
      postsCount: 56,
      avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&auto=format&fit=crop&q=80",
    },
    {
      slug: "distributed-systems",
      name: "r/distributed-systems",
      title: "Distributed Systems & Next.js",
      desc: "Low-latency systems, WebSockets, Prisma, and reactive backend pipelines.",
      members: "615",
      postsCount: 89,
      avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80",
    },
    {
      slug: "ai-research-agents",
      name: "r/ai-research-agents",
      title: "AI Research & Autonomous Agents",
      desc: "Multimodal interfaces, generative engineering, and agentic workflows.",
      members: "389",
      postsCount: 42,
      avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <main id="main-content" ref={heroRef} className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Search Modal Accessible Globally & From Hero */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-20 border-b border-slate-200 bg-white">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#1E293B 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Status Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-poppin-lilac-light border border-poppin-lilac-border text-xs font-bold text-poppin-navy mb-6">
            <span className="w-2 h-2 rounded-full bg-poppin-lilac animate-pulse" />
            <span>Modern Community & Real-Time Social Platform</span>
          </div>

          {/* Clean Wordmark */}
          <div className="flex justify-center mb-4">
            <div className="relative h-14 w-44 sm:h-16 sm:w-52">
              <Image
                src="/brand/poppin-logo.png"
                alt="Poppin."
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="hero-title text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-[1.15]">
            Where ideas connect and communities{" "}
            <span className="text-poppin-lilac underline decoration-poppin-lilac/30 decoration-wavy underline-offset-4">
              thrive.
            </span>
          </h1>

          <p className="hero-desc mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A fast, modern social network built for discussions that matter. Explore Reddit-style communities, real-time chats, and creator showcases.
          </p>

          {/* Prominent Search Bar on Landing Page Before Login */}
          <div className="hero-search-box mt-8 max-w-2xl mx-auto">
            <form
              onSubmit={handleHeroSearch}
              className="relative flex items-center p-1.5 rounded-2xl bg-slate-50 border border-slate-300 shadow-sm focus-within:border-poppin-lilac focus-within:ring-2 focus-within:ring-poppin-lilac/20 transition-all"
            >
              <div className="pl-3 text-slate-400 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-poppin-lilac" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators, communities (r/design-craft), topics (#ai)..."
                className="w-full pl-3 pr-3 py-2 bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-poppin-navy hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4 text-poppin-lilac" />
              </button>
            </form>

            {/* Quick Topic Jump Chips */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Try searching:</span>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-poppin-lilac-light hover:text-poppin-lilac text-slate-600 border border-slate-200 transition font-medium"
              >
                r/design-craft
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-poppin-lilac-light hover:text-poppin-lilac text-slate-600 border border-slate-200 transition font-medium"
              >
                r/distributed-systems
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-poppin-lilac-light hover:text-poppin-lilac text-slate-600 border border-slate-200 transition font-medium"
              >
                @alex_design
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-poppin-lilac-light hover:text-poppin-lilac text-slate-600 border border-slate-200 transition font-medium"
              >
                #nextjs
              </button>
            </div>
          </div>

          {/* Action Hub */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/feed"
                  className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-poppin-lilac hover:bg-poppin-lilac-hover text-white font-bold text-sm shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Go to Feed</span>
                </Link>
                <Link
                  href="/communities"
                  className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all"
                >
                  <Layers className="w-4 h-4 text-poppin-lilac" />
                  <span>Browse Communities</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="min-h-[46px] inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-poppin-lilac hover:bg-poppin-lilac-hover text-white font-extrabold text-sm shadow-sm transition-all"
                >
                  <span>Join the Community</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="min-h-[46px] inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/communities"
                  className="min-h-[46px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-slate-600 hover:text-poppin-lilac font-semibold text-sm transition-all"
                >
                  <span>Explore without an account</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Interactive Handle Probe Widget (Clean & Integrated) */}
          <div className="mt-10 max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="handle-probe-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Claim your unique handle
              </label>
              <span className="text-[11px] text-slate-400">Instant reservation</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 font-bold select-none text-sm">@</span>
              <input
                id="handle-probe-input"
                type="text"
                value={handleQuery}
                onChange={(e) => setHandleQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="choose_handle"
                maxLength={30}
                className="w-full pl-8 pr-10 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
              />
              <div className="absolute right-3 flex items-center pointer-events-none">
                {probeResult.loading ? (
                  <Loader2 className="w-4 h-4 text-poppin-lilac animate-spin" />
                ) : probeResult.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${
                  probeResult.isAvailable ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {probeResult.loading
                  ? "Checking availability..."
                  : probeResult.reason || "Available! 3-30 characters"}
              </span>
              <Link
                href={`/register?username=${encodeURIComponent(handleQuery)}`}
                className="text-poppin-lilac font-bold hover:underline inline-flex items-center gap-0.5"
              >
                Claim &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Communities Spotlight (Reddit Style) */}
      <section className="py-12 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-poppin-lilac uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4" />
              <span>Trending Communities</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Popular Spaces to Join Right Now
            </h2>
          </div>
          <Link
            href="/communities"
            className="inline-flex items-center gap-1 text-sm font-bold text-poppin-lilac hover:text-poppin-lilac-hover hover:underline"
          >
            <span>View all communities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {trendingHubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/communities/${hub.slug}`}
              className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-poppin-lilac/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={hub.avatar}
                    alt={hub.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-poppin-lilac transition">
                      {hub.name}
                    </h3>
                    <p className="text-xs text-slate-500">{hub.members} members</p>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">{hub.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{hub.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1 text-slate-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{hub.postsCount} active posts</span>
                </span>
                <span className="text-poppin-lilac group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Visit &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* What Makes Poppin Different (Crisp, High-Craft Features) */}
      <section className="py-12 bg-white border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs uppercase tracking-widest font-black text-poppin-lilac">
              Core Capabilities
            </h2>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
              Engineered for Real Collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-row bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-poppin-lilac-light text-poppin-lilac flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Messaging</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Persistent 1-on-1 and group chats with live WebSockets, instantaneous typing indicators, and unread counts.
              </p>
            </div>

            <div className="feature-row bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reddit-Style Communities</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Organized hubs with upvoting, hot/new sorting, post flairs, moderator controls, and structured threaded discussions.
              </p>
            </div>

            <div className="feature-row bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Native Media Uploads</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Drag-and-drop file uploads backed by S3 storage adapters. No need to paste image links manually.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">Poppin.</span>
            <span>&copy; {new Date().getFullYear()} Modern Community Platform.</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/communities" className="hover:text-poppin-lilac">
              Communities
            </Link>
            <Link href="/explore" className="hover:text-poppin-lilac">
              Explore
            </Link>
            <Link href="/register" className="hover:text-poppin-lilac">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
