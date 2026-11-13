/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

export interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  initials?: string;
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
  "2xl": "w-24 h-24 text-xl",
};

export function AvatarImage({
  src,
  alt,
  size = "md",
  className = "",
  initials,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Compute fallback initials from alt text if not provided
  const fallbackInitials = initials
    ? initials.slice(0, 2).toUpperCase()
    : alt
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || alt.slice(0, 2).toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#383A40] border border-white/10 text-[#F2F3F5] font-bold flex items-center justify-center shrink-0 uppercase select-none font-heading shadow-xs ${className}`}
        aria-label={alt}
      >
        {fallbackInitials ? (
          fallbackInitials
        ) : (
          <User className="w-1/2 h-1/2 text-[#B5BAC1]" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-white/10 shrink-0 bg-[#383A40] shadow-xs relative ${className}`}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
