"use client";

import React, { useState } from "react";
import { ConversationResponse } from "@/types";

interface GroupManageModalProps {
  conversation: ConversationResponse;
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  onGroupUpdated?: () => void;
}

export function GroupManageModal({
  conversation,
  currentUserId,
  isOpen,
  onClose,
  token,
  onGroupUpdated,
}: GroupManageModalProps) {
  const [name, setName] = useState(conversation.name || "");
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMember = conversation.members.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === "ADMIN";

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/groups/${conversation.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update group name");
      }
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update group");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUserId.trim()) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/groups/${conversation.id}/members`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userId: newMemberUserId.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to add member");
      }
      setNewMemberUserId("");
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Remove this member from the group?")) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/groups/${conversation.id}/members/${userId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to remove member");
      }
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">
            {isAdmin ? "Manage Group" : "Group Info"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Update Group Name Form (Admin Only) */}
        {isAdmin && (
          <form onSubmit={handleUpdateName} className="mb-4 pb-4 border-b border-gray-100">
            <label className="text-xs font-semibold text-gray-700 block mb-1">Group Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isUpdating || !name.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Add Member Form (Admin Only) */}
        {isAdmin && (
          <form onSubmit={handleAddMember} className="mb-4 pb-4 border-b border-gray-100">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Add Member by User ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="User ID (UUID)..."
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                className="flex-1 p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isUpdating || !newMemberUserId.trim()}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {errorMessage && (
          <div className="p-2.5 mb-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* Members List */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Members ({conversation.members.length})
          </h4>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {conversation.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-gray-900 truncate">
                    {member.user.displayName || member.user.username}
                  </span>
                  {member.role === "ADMIN" && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-3xs font-semibold">
                      Admin
                    </span>
                  )}
                </div>

                {isAdmin && member.userId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.userId)}
                    disabled={isUpdating}
                    className="text-red-500 hover:text-red-700 text-2xs font-medium ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

