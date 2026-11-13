"use client";

import React from "react";

export type FeedType = "for-you" | "following";

interface FeedTabsProps {
  activeTab: FeedType;
  onTabChange: (tab: FeedType) => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="flex items-center border-b border-white/10 bg-[#1E1F22] rounded-2xl mb-4 p-1">
      <button
        type="button"
        onClick={() => onTabChange("for-you")}
        className={`flex-1 py-2.5 text-xs font-bold text-center rounded-xl transition-all ${
          activeTab === "for-you"
            ? "bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/20"
            : "text-[#B5BAC1] hover:text-white hover:bg-white/5"
        }`}
      >
        For You
      </button>

      <button
        type="button"
        onClick={() => onTabChange("following")}
        className={`flex-1 py-2.5 text-xs font-bold text-center rounded-xl transition-all ${
          activeTab === "following"
            ? "bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/20"
            : "text-[#B5BAC1] hover:text-white hover:bg-white/5"
        }`}
      >
        Following
      </button>
    </div>
  );
}
