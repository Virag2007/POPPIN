/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { CommentResponse } from "@/types";
import { CornerDownRight, Trash2, Edit2 } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  token?: string | null;
  isModerator?: boolean;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentSection({
  postId,
  currentUserId: propUserId,
  token: propToken,
  isModerator = false,
  onCommentsCountChange,
}: CommentSectionProps) {
  const { user, token: authToken } = useAuth();
  const currentUserId = propUserId || user?.id;
  const token = propToken || authToken || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);

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
    <div className="pt-4 border-t border-white/10 mt-3 text-[#F2F3F5]">
      {/* Inline Comment Composer (X-Style) */}
      <form onSubmit={handleCreateComment} className="mb-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs shrink-0 font-heading border border-white/10 mt-1">
            {currentUserId ? "U" : "?"}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Post your reply..."
              rows={2}
              maxLength={2000}
              className="w-full p-3 text-xs text-[#F2F3F5] bg-[#383A40] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:bg-[#313338] placeholder-[#B5BAC1] resize-none transition-all"
            />
            <div className="flex items-center justify-between">
              {errorMessage ? (
                <p className="text-red-400 text-xs">{errorMessage}</p>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono">
                  {newCommentText.length}/2000
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !newCommentText.trim()}
                className="px-4 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comment Stream (X-Style Clean Inline Thread) */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-zinc-500">Loading replies...</div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-500 font-sans">
          No replies yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-white/5">
          {comments.map((comment) => {
            const isAuthor = currentUserId && currentUserId === comment.authorId;
            const authorInitials = (comment.author.displayName || comment.author.username || "U")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={comment.id} className="pt-3 first:pt-0">
                {/* Top-Level Comment */}
                <div className="flex items-start gap-3 group">
                  <Link
                    href={`/profiles/${encodeURIComponent(comment.author.username)}`}
                    className="shrink-0 mt-0.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs border border-white/10 overflow-hidden font-heading">
                      {comment.author.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        authorInitials
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/profiles/${encodeURIComponent(comment.author.username)}`}
                          className="font-bold text-xs text-[#F2F3F5] hover:underline"
                        >
                          {comment.author.displayName || comment.author.username}
                        </Link>
                        <span className="text-zinc-500 text-xs font-mono">
                          @{comment.author.username}
                        </span>
                        <span className="text-zinc-600 text-xs">·</span>
                        <span className="text-zinc-500 text-xs font-mono">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {(isAuthor || isModerator) && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditText(comment.content);
                              }}
                              className="p-1 text-zinc-400 hover:text-white transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-zinc-400 hover:text-red-400 transition"
                            title={isAuthor ? "Delete" : "Delete (as moderator)"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 text-xs text-white bg-[#383A40] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateComment(comment.id)}
                            className="px-3 py-1 bg-[#5865F2] text-white rounded-xl text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed font-sans">
                        {comment.content}
                      </p>
                    )}

                    {/* Inline Reply Trigger */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(replyingToId === comment.id ? null : comment.id);
                          setReplyText("");
                        }}
                        className="hover:text-[#5865F2] transition flex items-center gap-1 text-[11px] font-medium"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Reply
                      </button>
                    </div>

                    {/* Inline Reply Box */}
                    {replyingToId === comment.id && (
                      <div className="mt-3 flex gap-2">
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
                          className="flex-1 p-2 bg-[#383A40] text-xs text-white border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                        />
                        <button
                          type="button"
                          onClick={() => handleCreateReply(comment.id)}
                          disabled={isSubmitting || !replyText.trim()}
                          className="px-3 py-1.5 bg-[#5865F2] text-white rounded-xl text-xs font-bold hover:bg-[#4752C4] disabled:opacity-50"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Nested Replies (X-Style with Thread Line) */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-3">
                        {comment.replies.map((reply) => {
                          const isReplyAuthor = currentUserId && currentUserId === reply.authorId;
                          return (
                            <div key={reply.id} className="flex items-start gap-2.5 group">
                              <Link
                                href={`/profiles/${encodeURIComponent(reply.author.username)}`}
                                className="shrink-0 mt-0.5"
                              >
                                <div className="w-6 h-6 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-[10px] border border-white/10 overflow-hidden font-heading">
                                  {reply.author.avatar ? (
                                    <img
                                      src={reply.author.avatar}
                                      alt={reply.author.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (reply.author.displayName || reply.author.username || "U")
                                      .slice(0, 2)
                                      .toUpperCase()
                                  )}
                                </div>
                              </Link>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link
                                      href={`/profiles/${encodeURIComponent(reply.author.username)}`}
                                      className="font-bold text-xs text-[#F2F3F5] hover:underline"
                                    >
                                      {reply.author.displayName || reply.author.username}
                                    </Link>
                                    <span className="text-zinc-500 text-[11px] font-mono">
                                      @{reply.author.username}
                                    </span>
                                    <span className="text-zinc-600 text-xs">·</span>
                                    <span className="text-zinc-500 text-[11px] font-mono">
                                      {new Date(reply.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {(isReplyAuthor || isModerator) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                      title={isReplyAuthor ? "Delete" : "Delete (as moderator)"}
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
