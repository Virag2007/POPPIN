"use client";

import React from "react";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OnlineIndicator({
  isOnline,
  size = "md",
  className = "",
}: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  return (
    <span
      className={`relative inline-flex rounded-full ${sizeClasses[size]} ${className}`}
      title={isOnline ? "Online" : "Offline"}
    >
      {isOnline ? (
        <>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500 border border-white" />
        </>
      ) : (
        <span className="relative inline-flex rounded-full h-full w-full bg-slate-300 border border-white" />
      )}
    </span>
  );
}

