"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, LogIn } from "lucide-react";

export function LandingNavbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FCFBF9]/90 backdrop-blur-md border-b border-zinc-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 rounded-lg py-1"
          aria-label="POPPIN Home"
        >
          <span className="font-display text-xl font-bold tracking-tight text-zinc-950 group-hover:opacity-90 transition-opacity">
            POPPIN<span className="text-zinc-400">.</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </Link>

        {/* Public Action Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xs"
            >
              <span>Enter App</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-transparent transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                <span>Log in</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xs"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

