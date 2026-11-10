"use client";

import React from "react";

export type FeedType = "for-you" | "following";

interface FeedTabsProps {
  activeTab: FeedType;
  onTabChange: (tab: FeedType) => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="flex items-center border-b border-gray-200 bg-white rounded-t-xl mb-4">
      <button
        type="button"
        onClick={() => onTabChange("for-you")}
        className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
          activeTab === "for-you"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        For You
      </button>

      <button
        type="button"
        onClick={() => onTabChange("following")}
        className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
          activeTab === "following"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        Following
      </button>
    </div>
  );
}

