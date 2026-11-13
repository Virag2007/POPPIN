/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Search } from "lucide-react";

interface FollowUserItem {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  headline?: string | null;
  isFollowing?: boolean;
}

interface FollowRequestItem {
  id: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    headline: string | null;
  };
}

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  initialTab?: "followers" | "following" | "requests";
  isOwnProfile?: boolean;
  isPrivate?: boolean;
}

export function FollowersFollowingModal({
  isOpen,
  onClose,
  userId,
  username,
  initialTab = "followers",
  isOwnProfile = false,
  isPrivate = false,
}: FollowersFollowingModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "requests">(initialTab);
  const [users, setUsers] = useState<FollowUserItem[]>([]);
  const [requests, setRequests] = useState<FollowRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "requests") {
        const res = await fetch("/api/v1/users/me/follow-requests");
        const json = await res.json();
        if (res.ok && json.success) {
          setRequests(json.data || []);
        }
      } else {
        const endpoint =
          activeTab === "followers"
            ? `/api/v1/users/${userId}/followers`
            : `/api/v1/users/${userId}/following`;
        const res = await fetch(endpoint);
        const json = await res.json();
        if (res.ok && json.success) {
          const rawItems = (json.data?.items || json.data || []) as Record<string, unknown>[];
          const mapped: FollowUserItem[] = rawItems.map((item) => {
            const u = (item.follower || item.following || item) as Record<string, unknown>;
            const p = (u.profile || item.profile || u) as Record<string, unknown>;
            return {
              id: (item.id as string) || (u.id as string),
              userId: (u.id as string) || (item.userId as string),
              username: (p.username as string) || "user",
              displayName: (p.displayName as string) || null,
              avatar: (p.avatar as string) || null,
              headline: (p.headline as string) || null,
              isFollowing: (item.isFollowing as boolean | undefined) ?? true,
            };
          });
          setUsers(mapped);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, loadData]);

  const handleToggleFollow = async (targetUser: FollowUserItem) => {
    setActionLoadingId(targetUser.userId);
    try {
      if (targetUser.isFollowing) {
        await fetch(`/api/v1/users/${targetUser.userId}/follow`, { method: "DELETE" });
        setUsers((prev) =>
          prev.map((u) => (u.userId === targetUser.userId ? { ...u, isFollowing: false } : u))
        );
      } else {
        await fetch(`/api/v1/users/${targetUser.userId}/follow`, { method: "POST" });
        setUsers((prev) =>
          prev.map((u) => (u.userId === targetUser.userId ? { ...u, isFollowing: true } : u))
        );
      }
    } catch {
      // Reconcile
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFollower = async (followerUserId: string) => {
    if (!window.confirm("Remove this follower?")) return;
    setActionLoadingId(followerUserId);
    try {
      const res = await fetch(`/api/v1/users/${userId}/followers/${followerUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.userId !== followerUserId));
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveRequest = async (senderId: string) => {
    setActionLoadingId(senderId);
    try {
      const res = await fetch(`/api/v1/users/me/follow-requests/${senderId}`, { method: "POST" });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.senderId !== senderId));
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (senderId: string) => {
    setActionLoadingId(senderId);
    try {
      const res = await fetch(`/api/v1/users/me/follow-requests/${senderId}`, { method: "DELETE" });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.senderId !== senderId));
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.displayName?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="follow-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 text-[#F2F3F5]"
    >
      <div className="bg-[#2B2D31] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden flex flex-col h-[520px] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Tabs */}
        <div className="border-b border-white/10 px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("followers")}
              className={`text-xs font-bold font-heading pb-2 transition border-b-2 ${
                activeTab === "followers"
                  ? "text-white border-[#5865F2]"
                  : "text-[#B5BAC1] border-transparent hover:text-white"
              }`}
            >
              Followers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={`text-xs font-bold font-heading pb-2 transition border-b-2 ${
                activeTab === "following"
                  ? "text-white border-[#5865F2]"
                  : "text-[#B5BAC1] border-transparent hover:text-white"
              }`}
            >
              Following
            </button>
            {isOwnProfile && isPrivate && (
              <button
                type="button"
                onClick={() => setActiveTab("requests")}
                className={`text-xs font-bold font-heading pb-2 transition border-b-2 flex items-center gap-1.5 ${
                  activeTab === "requests"
                    ? "text-white border-[#5865F2]"
                    : "text-[#B5BAC1] border-transparent hover:text-white"
                }`}
              >
                <span>Requests</span>
                {requests.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#5865F2] text-[10px] text-white flex items-center justify-center font-mono">
                    {requests.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">@{username}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-[#B5BAC1] hover:text-white p-1 rounded-lg hover:bg-[#383A40] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {activeTab !== "requests" && (
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#383A40] text-xs text-white placeholder-zinc-500 rounded-xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-zinc-500">Loading...</div>
          ) : activeTab === "requests" ? (
            requests.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500 font-sans">
                No pending follow requests.
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#383A40] transition"
                >
                  <Link
                    href={`/profiles/${req.sender.username}`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs border border-white/10 overflow-hidden font-heading">
                      {req.sender.avatar ? (
                        <img
                          src={req.sender.avatar}
                          alt={req.sender.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (req.sender.displayName || req.sender.username).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#F2F3F5] truncate hover:underline">
                        {req.sender.displayName || req.sender.username}
                      </p>
                      <p className="text-[11px] text-[#B5BAC1] font-mono truncate">
                        @{req.sender.username}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoadingId === req.senderId}
                      onClick={() => handleApproveRequest(req.senderId)}
                      className="px-3 py-1 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === req.senderId}
                      onClick={() => handleRejectRequest(req.senderId)}
                      className="px-3 py-1 bg-[#383A40] hover:bg-[#313338] text-[#B5BAC1] text-xs font-medium rounded-xl transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-sans">
              No users found.
            </div>
          ) : (
            filteredUsers.map((item) => (
              <div
                key={item.userId}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#383A40] transition"
              >
                <Link
                  href={`/profiles/${item.username}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <div className="w-9 h-9 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs border border-white/10 overflow-hidden font-heading">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.username} className="w-full h-full object-cover" />
                    ) : (
                      (item.displayName || item.username).slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#F2F3F5] truncate hover:underline">
                      {item.displayName || item.username}
                    </p>
                    <p className="text-[11px] text-[#B5BAC1] font-mono truncate">
                      @{item.username}
                    </p>
                  </div>
                </Link>

                {isOwnProfile && activeTab === "followers" ? (
                  <button
                    type="button"
                    disabled={actionLoadingId === item.userId}
                    onClick={() => handleRemoveFollower(item.userId)}
                    className="px-3 py-1 bg-[#383A40] hover:bg-red-500/20 hover:text-red-400 text-[#B5BAC1] text-xs font-medium rounded-xl transition"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoadingId === item.userId}
                    onClick={() => handleToggleFollow(item)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                      item.isFollowing
                        ? "bg-[#383A40] text-[#B5BAC1] hover:bg-red-500/10 hover:text-red-400"
                        : "bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold"
                    }`}
                  >
                    {item.isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
