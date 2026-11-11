"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PostResponse } from "@/types";
import { PostCard } from "./post-card";
import { PostEditModal } from "./post-edit-modal";
import { CommentSection } from "@/components/engagement/comment-section";
import { ArrowLeft } from "lucide-react";

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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Back button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-poppin-navy hover:bg-slate-50 transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
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
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs mt-6">
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          token={token}
          onCommentsCountChange={(count) => setPost((prev) => ({ ...prev, commentsCount: count }))}
        />
      </div>
    </div>
  );
}
