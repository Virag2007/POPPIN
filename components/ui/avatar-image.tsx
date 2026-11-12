"use client";

import React, { useState } from "react";
import { OptimizedImage } from "./optimized-image";
import { User } from "lucide-react";

export interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  initials?: string;
}

const SIZE_CLASSES = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-xs",
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

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0 uppercase select-none ${className}`}
        aria-label={alt}
      >
        {initials ? initials.slice(0, 2) : <User className="w-1/2 h-1/2 text-slate-400" />}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 ${className}`}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        preset="avatar"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
