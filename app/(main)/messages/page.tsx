"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ConversationResponse } from "@/types";
import { ConversationItem, ChatWindow } from "@/components/messaging";
import { MessageSquare, Search, Loader2 } from "lucide-react";

function MessagesContent() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/conversations");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setConversations(data.data);

        // If targetUserId query param is passed, find or create direct conversation with them
        if (targetUserId) {
          const existing = data.data.find((c: ConversationResponse) =>
            !c.isGroup && c.members.some((m) => m.userId === targetUserId)
          );
          if (existing) {
            setSelectedConversation(existing);
          } else {
            // Initiate new direct conversation
            try {
              const initRes = await fetch("/api/v1/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientId: targetUserId }),
              });
              const initData = await initRes.json();
              if (initRes.ok && initData.success && initData.data) {
                setConversations((prev) => [initData.data, ...prev]);
                setSelectedConversation(initData.data);
              }
            } catch {
              // Ignore
            }
          }
        } else if (data.data.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data[0]);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, selectedConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const otherMember = c.members.find((m) => m.userId !== user?.id);
    const name = otherMember?.user.displayName || otherMember?.user.username || c.name || "";
    return name.toLowerCase().includes(q);
  });

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 text-[#F2F3F5]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Panel: Direct Conversation List */}
          <div
            className={`bg-[#1E1F22] rounded-2xl border border-white/10 p-4 shadow-lg flex flex-col h-[700px] ${
              selectedConversation ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                <h2 className="font-bold text-white text-sm font-heading">
                  Direct Messages
                </h2>
              </div>
              <span className="text-[11px] text-[#B5BAC1] font-mono">
                {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
              </span>
            </div>

            {/* Conversation Search Bar */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#383A40] text-xs text-white placeholder-zinc-500 rounded-xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>

            {/* Conversations Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {isLoading ? (
                <div className="py-20 text-center text-xs text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5865F2]" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-20 px-4 text-center text-xs text-[#B5BAC1] font-sans">
                  {searchQuery ? "No matching conversations." : "No conversations yet. Visit a member's profile to send a direct message."}
                </div>
              ) : (
                filteredConversations.map((conv) => (
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

          {/* Right Panel: Active 1-on-1 Chat Window */}
          <div
            className={`md:col-span-2 ${
              !selectedConversation ? "hidden md:block" : "block"
            }`}
          >
            {selectedConversation ? (
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#313338] h-[700px] flex flex-col">
                <ChatWindow
                  conversation={selectedConversation}
                  currentUserId={user?.id}
                  token={token}
                  onBack={() => setSelectedConversation(null)}
                />
              </div>
            ) : (
              <div className="bg-[#1E1F22] rounded-2xl border border-white/10 h-[700px] shadow-lg flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 bg-[#383A40] text-[#5865F2] rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-white text-base mb-1 font-heading">
                  POPPIN Direct Messaging
                </h3>
                <p className="text-xs text-[#B5BAC1] max-w-sm leading-relaxed font-sans">
                  Select a member conversation on the left to start chatting in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#5865F2]" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
