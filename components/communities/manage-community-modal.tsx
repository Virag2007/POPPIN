/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Users,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";

interface MemberItem {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  displayName: string;
  username: string;
  avatar: string | null;
  headline: string | null;
}

interface JoinRequestItem {
  id: string;
  userId: string;
  createdAt: string;
  displayName: string;
  username: string;
  avatar: string | null;
  headline: string | null;
}

interface ManageCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  communityName: string;
  currentUserRole?: "ADMIN" | "MODERATOR" | "MEMBER" | null;
  token?: string | null;
}

export function ManageCommunityModal({
  isOpen,
  onClose,
  slug,
  communityName,
  currentUserRole,
  token,
}: ManageCommunityModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"members" | "requests" | "danger">("members");

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState("");
  const [isDeletingCommunity, setIsDeletingCommunity] = useState(false);

  const isAdmin = currentUserRole === "ADMIN";

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  const fetchMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const res = await fetch(`/api/v1/communities/${slug}/members`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMembers(false);
    }
  }, [slug, getHeaders]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch(`/api/v1/communities/${slug}/requests`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingRequests(false);
    }
  }, [slug, getHeaders]);

  useEffect(() => {
    if (isOpen) {
      setActionError(null);
      setActionSuccess(null);
      fetchMembers();
      fetchRequests();
    }
  }, [isOpen, fetchMembers, fetchRequests]);

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the hub?")) return;
    setActionLoading(userId);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/communities/${slug}/members/${userId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to remove member");
      }
      setActionSuccess("Member removed successfully.");
      await fetchMembers();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleModerator = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "MODERATOR" ? "MEMBER" : "MODERATOR";
    setActionLoading(userId);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/communities/${slug}/members/${userId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update member role");
      }
      setActionSuccess(`Role updated to ${nextRole}.`);
      await fetchMembers();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update member role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(requestId);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/communities/${slug}/requests/${requestId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to process request");
      }
      setActionSuccess(`Request ${action.toLowerCase()}d successfully.`);
      await fetchRequests();
      await fetchMembers();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCommunity = async () => {
    if (confirmDelete !== slug) {
      setActionError(`Please type "${slug}" to confirm deletion.`);
      return;
    }
    setIsDeletingCommunity(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/communities/${slug}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete community");
      }
      onClose();
      router.push("/communities");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete community");
      setIsDeletingCommunity(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1E1F22] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2B2D31]/50">
          <div>
            <h2 className="text-base font-bold text-white font-heading">
              Manage Hub • {communityName}
            </h2>
            <p className="text-xs text-[#8A9BFF] font-mono mt-0.5">c/{slug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 gap-6 bg-[#2B2D31]/20 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "members"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "requests"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Join Requests ({requests.length})</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("danger")}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === "danger"
                  ? "border-rose-500 text-rose-400"
                  : "border-transparent text-zinc-400 hover:text-rose-400"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </button>
          )}
        </div>

        {/* Feedback banners */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "members" && (
            <div>
              {loadingMembers ? (
                <div className="py-12 flex items-center justify-center text-zinc-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
                  <span>Loading hub members...</span>
                </div>
              ) : members.length === 0 ? (
                <p className="text-center py-8 text-zinc-400 text-xs">No members found.</p>
              ) : (
                <div className="space-y-2.5">
                  {members.map((member) => {
                    const isMemberAdmin = member.role === "ADMIN";
                    const isMemberMod = member.role === "MODERATOR";

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#2B2D31]/60 border border-white/5 hover:border-white/10 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.displayName}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                              {(member.displayName || member.username).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate font-heading">
                                {member.displayName}
                              </span>
                              {isMemberAdmin && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  <Crown className="w-3 h-3" />
                                  Admin
                                </span>
                              )}
                              {isMemberMod && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5865F2]/10 text-[#8A9BFF] border border-[#5865F2]/30">
                                  <Shield className="w-3 h-3" />
                                  Mod
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              @{member.username}
                            </span>
                          </div>
                        </div>

                        {/* Moderation Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isAdmin && !isMemberAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleModerator(member.userId, member.role)}
                              disabled={actionLoading === member.userId}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#383A40] text-zinc-200 hover:text-white hover:bg-white/10 transition"
                            >
                              {isMemberMod ? "Demote to Member" : "Promote to Mod"}
                            </button>
                          )}

                          {!isMemberAdmin && (isAdmin || !isMemberMod) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={actionLoading === member.userId}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Remove member"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              {loadingRequests ? (
                <div className="py-12 flex items-center justify-center text-zinc-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
                  <span>Loading join requests...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-10">
                  <UserCheck className="w-8 h-8 text-zinc-500 mx-auto mb-2 opacity-50" />
                  <p className="text-zinc-400 text-xs">No pending join requests.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#2B2D31]/60 border border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {req.avatar ? (
                          <img
                            src={req.avatar}
                            alt={req.displayName}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#383A40] text-white flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                            {(req.displayName || req.username).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate font-heading">
                            {req.displayName}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono">@{req.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req.id, "APPROVE")}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req.id, "REJECT")}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#383A40] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "danger" && isAdmin && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Delete Community Permanently</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  This action is irreversible. Deleting <strong>{communityName}</strong> will permanently remove all member records, channels, discussions, and associated media from PostgreSQL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Type <span className="font-mono text-rose-400">{slug}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value.trim().toLowerCase())}
                  placeholder={slug}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141517] border border-white/10 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={handleDeleteCommunity}
                disabled={confirmDelete !== slug || isDeletingCommunity}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isDeletingCommunity ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting Hub...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>I understand the consequences, delete this community</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
