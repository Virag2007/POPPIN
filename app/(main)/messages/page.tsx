"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConversationResponse } from "@/types";
import { ConversationItem, ChatWindow, GroupManageModal } from "@/components/messaging";
import { MessageSquare, Plus, Users, Sparkles, X } from "lucide-react";

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
    <main className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Sidebar / Conversation List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[680px]">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-poppin-lilac" />
                <h2 className="font-heading font-bold text-slate-900 text-sm">
                  Messages
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupInput(!showCreateGroupInput)}
                className="inline-flex items-center gap-1 text-xs font-bold text-poppin-lilac hover:text-poppin-navy transition px-2.5 py-1 rounded-lg hover:bg-poppin-lilac/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Group</span>
              </button>
            </div>

            {/* Quick Group Creator Dropdown */}
            {showCreateGroupInput && (
              <form
                onSubmit={handleCreateGroup}
                className="p-3.5 mb-3 bg-slate-50 rounded-2xl text-xs space-y-2.5 border border-slate-200/80 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-poppin-lilac" />
                    Create Group Hub
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupInput(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Group Name (e.g. Design Systems Lead)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:border-poppin-lilac"
                />
                <input
                  type="text"
                  placeholder="Initial Member User ID..."
                  value={newGroupMemberId}
                  onChange={(e) => setNewGroupMemberId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:border-poppin-lilac font-mono"
                />
                {createGroupError && (
                  <p className="text-red-600 text-[11px]">{createGroupError}</p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupInput(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-poppin-navy text-white rounded-xl font-bold text-xs hover:bg-poppin-navy/90 transition shadow-2xs"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {isLoading ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  Loading chats...
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4 text-xs text-slate-400">
                  No conversations yet. Visit any creator profile to start a direct message!
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
              <div className="rounded-3xl overflow-hidden shadow-xs border border-slate-200/80">
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
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 h-[680px] shadow-xs flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 bg-poppin-lilac/10 text-poppin-lilac rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-slate-900 text-base mb-1">
                  POPPIN Direct Messaging
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Select a conversation on the left or create a new group hub to chat and collaborate in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
