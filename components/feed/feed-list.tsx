"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PostResponse } from "@/types";
import { PostCard } from "@/components/posts/post-card";
import { PostEditModal } from "@/components/posts/post-edit-modal";
import { FeedType } from "./feed-tabs";

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
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [feedType, token]
  );

  useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div>
      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/6" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3.5 bg-gray-200 rounded w-full" />
                <div className="h-3.5 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="bg-white rounded-xl border border-red-200 p-6 text-center shadow-sm">
          <p className="text-xs text-red-600 mb-3">{errorMessage}</p>
          <button
            type="button"
            onClick={() => loadFeed(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            {feedType === "following" ? "No posts in your Following feed" : "No posts found"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {feedType === "following"
              ? "Follow other creators to see their updates and project showcases here."
              : "Check back later or be the first to publish a post!"}
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
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
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

