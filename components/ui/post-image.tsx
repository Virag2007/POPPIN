"use client";

import React from "react";
import { OptimizedImage } from "./optimized-image";

export interface PostImageProps {
  src: string | null | undefined;
  alt: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
  className?: string;
  priority?: boolean;
}

export function PostImage({
  src,
  alt,
  aspectRatio = "auto",
  className = "",
  priority = false,
}: PostImageProps) {
  let aspectClass = "";
  let preset: "squarePost" | "portraitPost" | "cover" | undefined = undefined;

  switch (aspectRatio) {
    case "square":
      aspectClass = "aspect-square";
      preset = "squarePost";
      break;
    case "portrait":
      aspectClass = "aspect-[4/5]";
      preset = "portraitPost";
      break;
    case "landscape":
      aspectClass = "aspect-video";
      preset = "cover";
      break;
    default:
      aspectClass = "max-h-[550px] w-auto";
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group ${aspectClass} ${className}`}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        preset={preset}
        priority={priority}
        className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
      />
    </div>
  );
}

