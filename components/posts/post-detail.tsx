"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PostResponse } from "@/types";
import { PostCard } from "./post-card";
import { PostEditModal } from "./post-edit-modal";
import { CommentSection } from "@/components/engagement/comment-section";

interface PostDetailProps {
  initialPost: PostResponse;
  currentUserId?: string;
  token?: string | null;
}

export function PostDetail({ initialPost, currentUserId, token }: PostDetailProps) {
  const router = useRouter();
  const [post, setPost] = useState<PostResponse>(initialPost);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async (postId: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/v1/posts/${postId}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data?.error?.message || "Failed to delete post");
      return;
    }

    router.push("/feed");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Main Post Card */}
      <PostCard
        post={post}
        currentUserId={currentUserId}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDelete}
      />

      {/* Edit Modal */}
      <PostEditModal
        post={post}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => setPost(updated)}
        token={token}
      />

      {/* Comment Section with 1-Level Replies */}
      <CommentSection
        postId={post.id}
        currentUserId={currentUserId}
        token={token}
        onCommentsCountChange={(count) => setPost((prev) => ({ ...prev, commentsCount: count }))}
      />
    </div>
  );
}
