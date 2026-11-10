"use client";

import React, { useState } from "react";

interface SaveButtonProps {
  postId: string;
  initialSaved?: boolean;
  token?: string | null;
  onSavedChange?: (saved: boolean) => void;
}

export function SaveButton({
  postId,
  initialSaved = false,
  token,
  onSavedChange,
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSave = async () => {
    if (isLoading) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/posts/${postId}/save`, {
        method: nextSaved ? "POST" : "DELETE",
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        setIsSaved(!nextSaved);
      } else if (onSavedChange) {
        onSavedChange(nextSaved);
      }
    } catch {
      setIsSaved(!nextSaved);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        isSaved
          ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
      title={isSaved ? "Unsave post" : "Save post"}
      aria-label={isSaved ? "Unsave post" : "Save post"}
    >
      <svg
        className={`w-4 h-4 transition-transform active:scale-125 ${
          isSaved ? "fill-blue-600 stroke-blue-600" : "fill-none stroke-current"
        }`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>{isSaved ? "Saved" : "Save"}</span>
    </button>
  );
}

