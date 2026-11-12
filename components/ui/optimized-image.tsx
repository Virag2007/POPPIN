/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  getTransformedImageUrl,
  ImageTransformationOptions,
  PRESET_CONFIGS,
} from "@/lib/storage/image-transformations";

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
  alt: string;
  preset?: ImageTransformationOptions["preset"];
  transformOptions?: ImageTransformationOptions;
  fallbackSrc?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  preset,
  transformOptions,
  fallbackSrc = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
  className = "",
  width,
  height,
  fill,
  priority,
  sizes,
  ...rest
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src && !fallbackSrc) {
    return null;
  }

  // Resolve target preset dimensions if given
  const presetConfig = preset ? PRESET_CONFIGS[preset] : undefined;
  const targetWidth = typeof width === "number" ? width : presetConfig?.width;
  const targetHeight = typeof height === "number" ? height : presetConfig?.height;

  const resolvedSrc = hasError
    ? fallbackSrc
    : getTransformedImageUrl(src, {
        preset,
        ...transformOptions,
      }) || fallbackSrc;

  // If using Next.js Image fill layout
  if (fill) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          onError={() => setHasError(true)}
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden inline-block ${className}`}>
      <img
        src={resolvedSrc}
        alt={alt}
        width={targetWidth}
        height={targetHeight}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        loading={priority ? "eager" : "lazy"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        {...rest}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
    </div>
  );
}
