"use client";

import React, { useState } from "react";

interface LikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount: number;
  token?: string | null;
  onLikedChange?: (liked: boolean, count: number) => void;
}

export function LikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  token,
  onLikedChange,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    if (isLoading) return;

    // Optimistic UI update
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);
    setIsLiked(nextLiked);
    setCount(nextCount);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/posts/${postId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on failure
        setIsLiked(!nextLiked);
        setCount(count);
      } else {
        const confirmedCount = data.data.likesCount;
        setCount(confirmedCount);
        if (onLikedChange) {
          onLikedChange(nextLiked, confirmedCount);
        }
      }
    } catch {
      // Rollback on error
      setIsLiked(!nextLiked);
      setCount(count);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        isLiked
          ? "text-red-600 bg-red-50 hover:bg-red-100"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
      title={isLiked ? "Unlike post" : "Like post"}
      aria-label={isLiked ? "Unlike post" : "Like post"}
    >
      <svg
        className={`w-4 h-4 transition-transform active:scale-125 ${
          isLiked ? "fill-red-600 stroke-red-600" : "fill-none stroke-current"
        }`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}

