"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConversationResponse } from "@/types";
import { ConversationItem, ChatWindow, GroupManageModal } from "@/components/messaging";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showCreateGroupInput, setShowCreateGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMemberId, setNewGroupMemberId] = useState("");
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/conversations");
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations(data.data);
        if (data.data.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data[0]);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupMemberId.trim()) return;

    try {
      setCreateGroupError(null);
      const res = await fetch("/api/v1/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          memberIds: [newGroupMemberId.trim()],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create group");
      }

      setNewGroupName("");
      setNewGroupMemberId("");
      setShowCreateGroupInput(false);
      await loadConversations();
      setSelectedConversation(data.data);
    } catch (err: unknown) {
      setCreateGroupError(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar / Conversation List */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h2 className="font-bold text-gray-900 text-sm">Messages</h2>
              <button
                type="button"
                onClick={() => setShowCreateGroupInput(!showCreateGroupInput)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                + New Group
              </button>
            </div>

            {/* Quick Group Creator Dropdown */}
            {showCreateGroupInput && (
              <form onSubmit={handleCreateGroup} className="p-3 mb-3 bg-gray-50 rounded-lg text-xs space-y-2 border border-gray-200">
                <input
                  type="text"
                  placeholder="Group Name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Member User ID (UUID)..."
                  value={newGroupMemberId}
                  onChange={(e) => setNewGroupMemberId(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded bg-white text-xs"
                />
                {createGroupError && (
                  <p className="text-red-600 text-3xs">{createGroupError}</p>
                )}
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupInput(false)}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {isLoading ? (
                <div className="text-center py-12 text-xs text-gray-400">Loading chats...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  No conversations yet. Start one with another user!
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="cursor-pointer"
                  >
                    <ConversationItem
                      conversation={conv}
                      isActive={selectedConversation?.id === conv.id}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2">
            {selectedConversation ? (
              <>
                <ChatWindow
                  conversation={selectedConversation}
                  onOpenGroupManage={() => setIsGroupModalOpen(true)}
                />
                {isGroupModalOpen && (
                  <GroupManageModal
                    conversation={selectedConversation}
                    isOpen={isGroupModalOpen}
                    onClose={() => setIsGroupModalOpen(false)}
                    onGroupUpdated={loadConversations}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 h-[650px] shadow-sm flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Your Messages</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  Select an existing conversation from the list or start a new group chat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

