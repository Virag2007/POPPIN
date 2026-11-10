"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CommentResponse } from "@/types";

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  token?: string | null;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentSection({
  postId,
  currentUserId,
  token,
  onCommentsCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data);
        const totalCount = (data.data as CommentResponse[]).reduce(
          (sum, c) => sum + 1 + (c.replies?.length || 0),
          0
        );
        if (onCommentsCountChange) {
          onCommentsCountChange(totalCount);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [postId, getHeaders, onCommentsCountChange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content: newCommentText.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to post comment");
      }

      setNewCommentText("");
      await loadComments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          content: replyText.trim(),
          replyToCommentId: parentCommentId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to post reply");
      }

      setReplyText("");
      setReplyingToId(null);
      await loadComments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ content: editText.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update comment");
      }

      setEditingCommentId(null);
      setEditText("");
      await loadComments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error?.message || "Failed to delete comment");
        return;
      }

      await loadComments();
    } catch {
      alert("Failed to delete comment");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-4">
      <h4 className="font-semibold text-gray-900 text-sm mb-4">Comments</h4>

      {/* Main Composer */}
      <form onSubmit={handleCreateComment} className="mb-6">
        <div className="flex gap-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            maxLength={2000}
            className="w-full p-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg self-end"
          >
            Comment
          </button>
        </div>
        {errorMessage && (
          <p className="text-red-600 text-2xs mt-1.5">{errorMessage}</p>
        )}
      </form>

      {/* Comment Thread List */}
      {isLoading ? (
        <div className="text-center py-6 text-xs text-gray-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400 border-t border-dashed border-gray-200">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
          {comments.map((comment) => {
            const isAuthor = currentUserId && currentUserId === comment.authorId;
            const authorInitials = (comment.author.displayName || comment.author.username || "U")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={comment.id} className="flex flex-col gap-2">
                {/* Top-Level Comment */}
                <div className="flex items-start gap-2.5 group">
                  {comment.author.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.username}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">
                      {authorInitials}
                    </div>
                  )}

                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/profiles/${encodeURIComponent(comment.author.username)}`}
                          className="font-semibold text-gray-900 hover:underline"
                        >
                          {comment.author.displayName || comment.author.username}
                        </Link>
                        <span className="text-gray-400 text-2xs">@{comment.author.username}</span>
                      </div>
                      <span className="text-gray-400 text-2xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full p-2 text-xs border border-gray-300 rounded bg-white"
                        />
                        <div className="flex justify-end gap-1.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="px-2 py-1 text-2xs text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateComment(comment.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-2xs font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 whitespace-pre-line">{comment.content}</p>
                    )}

                    {/* Actions: Reply, Edit, Delete */}
                    <div className="flex items-center gap-3 mt-2 text-2xs text-gray-500 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(replyingToId === comment.id ? null : comment.id);
                          setReplyText("");
                        }}
                        className="hover:text-blue-600 transition-colors"
                      >
                        Reply
                      </button>

                      {isAuthor && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditText(comment.content);
                            }}
                            className="hover:text-gray-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline 1-Level Reply Composer */}
                {replyingToId === comment.id && (
                  <div className="ml-10 flex gap-2">
                    <input
                      type="text"
                      placeholder={`Reply to @${comment.author.username}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateReply(comment.id);
                        }
                      }}
                      className="flex-1 p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateReply(comment.id)}
                      disabled={isSubmitting || !replyText.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* 1-Level Nested Replies List (Strictly 1 Level Only) */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-10 flex flex-col gap-2 border-l-2 border-gray-100 pl-3">
                    {comment.replies.map((reply) => {
                      const isReplyAuthor = currentUserId && currentUserId === reply.authorId;
                      const replyInitials = (reply.author.displayName || reply.author.username || "U")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div key={reply.id} className="flex items-start gap-2 group">
                          {reply.author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={reply.author.avatar}
                              alt={reply.author.username}
                              className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">
                              {replyInitials}
                            </div>
                          )}

                          <div className="flex-1 bg-gray-50 rounded-lg p-2.5 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/profiles/${encodeURIComponent(reply.author.username)}`}
                                  className="font-semibold text-gray-900 hover:underline"
                                >
                                  {reply.author.displayName || reply.author.username}
                                </Link>
                                <span className="text-gray-400 text-2xs">@{reply.author.username}</span>
                              </div>
                              <span className="text-gray-400 text-2xs">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {editingCommentId === reply.id ? (
                              <div className="mt-1.5">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white"
                                />
                                <div className="flex justify-end gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="px-2 py-0.5 text-2xs text-gray-600 hover:text-gray-800"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateComment(reply.id)}
                                    className="px-2 py-0.5 bg-blue-600 text-white rounded text-2xs font-semibold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-800 whitespace-pre-line">{reply.content}</p>
                            )}

                            {isReplyAuthor && (
                              <div className="flex items-center gap-3 mt-1.5 text-2xs text-gray-500 font-medium">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(reply.id);
                                    setEditText(reply.content);
                                  }}
                                  className="hover:text-gray-900 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="hover:text-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

