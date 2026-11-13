import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E1B] text-white p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#8A9BFF] mb-6 shadow-xl shadow-[#5865F2]/20">
        <Compass className="w-8 h-8 animate-spin-slow" />
      </div>

      <h1 className="font-heading text-4xl sm:text-6xl font-black text-white tracking-tight">
        404 — SPACE NOT FOUND
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base max-w-md mt-3 leading-relaxed">
        The channel, community, or page you are looking for has either drifted into deep
        space or never existed.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-lg shadow-[#5865F2]/30 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}

