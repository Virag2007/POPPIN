"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PostResponse } from "@/types";
import { PostCard } from "@/components/posts/post-card";
import { PostEditModal } from "@/components/posts/post-edit-modal";
import { FeedType } from "./feed-tabs";
import { MessageSquare } from "lucide-react";

interface FeedListProps {
  feedType: FeedType;
  currentUserId?: string;
  token?: string | null;
  newPost?: PostResponse | null;
}

export function FeedList({ feedType, currentUserId, token, newPost }: FeedListProps) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit modal
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);

  // Prepend new post if created
  useEffect(() => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
    }
  }, [newPost]);

  const loadFeed = useCallback(
    async (isInitial = true, nextCursor?: string | null) => {
      if (isInitial) {
        setIsLoading(true);
        setErrorMessage(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const endpoint = feedType === "following" ? "/api/v1/feed/following" : "/api/v1/feed/for-you";
        const query = new URLSearchParams();
        query.set("limit", "15");
        if (nextCursor) {
          query.set("cursor", nextCursor);
        }

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${endpoint}?${query.toString()}`, { headers });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || "Failed to load feed");
        }

        const newItems: PostResponse[] = data.data.items;
        const returnedCursor: string | null = data.data.nextCursor;
        const returnedHasMore: boolean = data.data.hasMore;

        if (isInitial) {
          setPosts(newItems);
        } else {
          setPosts((prev) => [...prev, ...newItems]);
        }

        setCursor(returnedCursor);
        setHasMore(returnedHasMore);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load feed");
      } finally {
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [feedType, token]
  );

  useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  const handlePostUpdated = (updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPost(null);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#2B2D31] rounded-2xl border border-white/10 p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3 bg-white/10 rounded" />
                  <div className="w-20 h-2 bg-white/5 rounded" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="w-full h-3 bg-white/10 rounded" />
                <div className="w-4/5 h-3 bg-white/10 rounded" />
              </div>
              <div className="w-24 h-6 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="bg-[#2B2D31] rounded-2xl border border-white/10 p-8 text-center shadow-lg">
          <p className="text-xs text-red-400 mb-3">{errorMessage}</p>
          <button
            type="button"
            onClick={() => loadFeed(true)}
            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#2B2D31] rounded-2xl border border-white/10 p-12 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-[#383A40] text-[#5865F2] flex items-center justify-center mx-auto mb-3 border border-white/10">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-[#F2F3F5] text-sm mb-1 font-heading">
            {feedType === "following" ? "No posts in your Following feed" : "No posts found"}
          </h3>
          <p className="text-xs text-[#B5BAC1] max-w-sm mx-auto leading-relaxed">
            {feedType === "following"
              ? "Follow other members on POPPIN to see their updates and project showcases here."
              : "Check back later or be the first to publish a post in the community!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              token={token}
              onEdit={(p) => setEditingPost(p)}
              onDelete={handleDeletePost}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-2 pb-6">
              <button
                type="button"
                onClick={() => loadFeed(false, cursor)}
                disabled={isLoadingMore}
                className="px-5 py-2.5 bg-[#2B2D31] border border-white/10 rounded-xl text-xs font-semibold text-[#F2F3F5] hover:bg-[#383A40] shadow-sm disabled:opacity-50 inline-flex items-center gap-2 transition"
              >
                {isLoadingMore ? "Loading more posts..." : "Load More Posts"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <PostEditModal
          post={editingPost}
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onUpdated={handlePostUpdated}
          token={token}
        />
      )}
    </div>
  );
}
