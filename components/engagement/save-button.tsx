"use client";

import React, { useState } from "react";
import { Bookmark } from "lucide-react";

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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
        isSaved
          ? "text-[#09090B] bg-zinc-100"
          : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
      }`}
      title={isSaved ? "Unsave post" : "Save post"}
      aria-label={isSaved ? "Unsave post" : "Save post"}
    >
      <Bookmark
        className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
          isSaved ? "fill-zinc-950 stroke-zinc-950" : "fill-none stroke-current"
        }`}
      />
      <span>{isSaved ? "Saved" : "Save"}</span>
    </button>
  );
}
