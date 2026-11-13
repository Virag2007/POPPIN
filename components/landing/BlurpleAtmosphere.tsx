"use client";

import React from "react";

export function BlurpleAtmosphere({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full bg-[#0B0E1B] text-white overflow-hidden selection:bg-[#5865F2] selection:text-white ${className}`}
    >
      {/* 1. Global Multi-Layer Ambient Radial Lights */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-Center Dominant Hero Glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-60 blur-[140px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(88,101,242,0.85) 0%, rgba(44,84,234,0.45) 45%, rgba(11,14,27,0) 75%)",
          }}
        />

        {/* Top-Right Soft Electric Violet Glow */}
        <div
          className="absolute top-1/4 -right-40 w-[700px] h-[700px] rounded-full opacity-45 blur-[160px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(138,43,226,0.55) 0%, rgba(88,101,242,0.3) 50%, rgba(11,14,27,0) 80%)",
          }}
        />

        {/* Mid-Left Cyan/Electric Blue Accent */}
        <div
          className="absolute top-1/2 -left-48 w-[650px] h-[650px] rounded-full opacity-40 blur-[150px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(44,84,234,0.6) 0%, rgba(30,58,138,0.35) 50%, rgba(11,14,27,0) 80%)",
          }}
        />

        {/* Bottom Pink/Magenta Atmospheric Filament */}
        <div
          className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] rounded-full opacity-25 blur-[160px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(235,69,158,0.5) 0%, rgba(88,101,242,0.2) 50%, rgba(11,14,27,0) 80%)",
          }}
        />

        {/* Deep Bottom Midnight Navy Anchor */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] rounded-full opacity-50 blur-[150px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(88,101,242,0.4) 0%, rgba(19,25,54,0.8) 55%, rgba(11,14,27,0) 85%)",
          }}
        />

        {/* 2. Micro Starfield / Twinkling Points */}
        <svg
          className="absolute inset-0 w-full h-full opacity-65"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor="#8A9BFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#5865F2" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Group 1: High-brightness crisp stars */}
          <circle cx="8%" cy="12%" r="1.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="15%" cy="28%" r="2" fill="url(#star-glow)" opacity="0.8" />
          <circle cx="24%" cy="8%" r="1" fill="#FFFFFF" opacity="0.6" />
          <circle cx="35%" cy="22%" r="2.5" fill="url(#star-glow)" opacity="0.9" />
          <circle cx="48%" cy="14%" r="1" fill="#FFFFFF" opacity="0.5" />
          <circle cx="62%" cy="6%" r="2" fill="url(#star-glow)" opacity="0.75" />
          <circle cx="75%" cy="18%" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="88%" cy="10%" r="2.5" fill="url(#star-glow)" opacity="0.85" />
          <circle cx="94%" cy="25%" r="1" fill="#FFFFFF" opacity="0.5" />

          {/* Group 2: Mid-screen stars */}
          <circle cx="5%" cy="45%" r="2" fill="url(#star-glow)" opacity="0.7" />
          <circle cx="18%" cy="52%" r="1.5" fill="#FFFFFF" opacity="0.6" />
          <circle cx="29%" cy="38%" r="1" fill="#FFFFFF" opacity="0.4" />
          <circle cx="42%" cy="60%" r="2.5" fill="url(#star-glow)" opacity="0.8" />
          <circle cx="55%" cy="48%" r="1" fill="#FFFFFF" opacity="0.5" />
          <circle cx="70%" cy="58%" r="2" fill="url(#star-glow)" opacity="0.7" />
          <circle cx="82%" cy="42%" r="1" fill="#FFFFFF" opacity="0.6" />
          <circle cx="92%" cy="55%" r="2.5" fill="url(#star-glow)" opacity="0.8" />

          {/* Group 3: Lower-half stars */}
          <circle cx="12%" cy="75%" r="1.5" fill="#FFFFFF" opacity="0.6" />
          <circle cx="26%" cy="84%" r="2" fill="url(#star-glow)" opacity="0.75" />
          <circle cx="39%" cy="70%" r="1" fill="#FFFFFF" opacity="0.5" />
          <circle cx="51%" cy="88%" r="2.5" fill="url(#star-glow)" opacity="0.85" />
          <circle cx="68%" cy="78%" r="1" fill="#FFFFFF" opacity="0.4" />
          <circle cx="79%" cy="92%" r="2" fill="url(#star-glow)" opacity="0.8" />
          <circle cx="91%" cy="80%" r="1.5" fill="#FFFFFF" opacity="0.7" />
        </svg>

        {/* 3. Subtle Atmospheric Grid Texture (Noise overlay) */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Content Mount */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

