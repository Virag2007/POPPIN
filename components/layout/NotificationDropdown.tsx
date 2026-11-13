/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Layers,
  CheckCheck,
  Loader2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  entityId: string | null;
  message?: string;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    profile?: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
}

export function NotificationDropdown() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Load unread count & notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      const res = await fetch("/api/v1/notifications?limit=15", { headers });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const items = data.data.items || [];
        setNotifications(items);
        setUnreadCount(items.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      const headers: Record<string, string> = {};
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      await fetch("/api/v1/notifications/read-all", {
        method: "PATCH",
        headers,
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Keep state
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        const headers: Record<string, string> = {};
        const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
        if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

        await fetch(`/api/v1/notifications/${notif.id}/read`, {
          method: "PATCH",
          headers,
        });

        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Continue
      }
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
      case "POST_LIKE":
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />;
      case "COMMENT":
      case "POST_COMMENT":
      case "REPLY":
        return <MessageSquare className="w-3.5 h-3.5 text-[#8A9BFF]" />;
      case "FOLLOW":
      case "NEW_FOLLOWER":
        return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getNotificationText = (notif: NotificationItem) => {
    const actorName = notif.actor.profile?.displayName || notif.actor.profile?.username || "Someone";
    switch (notif.type) {
      case "LIKE":
      case "POST_LIKE":
        return `${actorName} liked your post`;
      case "COMMENT":
      case "POST_COMMENT":
        return `${actorName} commented on your post`;
      case "REPLY":
        return `${actorName} replied to your comment`;
      case "FOLLOW":
      case "NEW_FOLLOWER":
        return `${actorName} started following you`;
      default:
        return notif.message || `${actorName} interacted with your content`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-zinc-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5865F2] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5865F2]" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#1E1F22] border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 text-[#F2F3F5]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#17181B]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#5865F2] text-white font-mono">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#5865F2]" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Bell className="w-8 h-8 text-zinc-500 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-zinc-300">No notifications yet</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Activity on your posts, comments, and profile will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 flex items-start gap-3 hover:bg-white/5 cursor-pointer transition-colors ${
                    !notif.isRead ? "bg-[#5865F2]/10" : ""
                  }`}
                >
                  {/* Icon / Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.actor.profile?.avatar ? (
                      <img
                        src={notif.actor.profile.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#313338] flex items-center justify-center text-xs font-bold text-[#8A9BFF] border border-white/10">
                        {notif.actor.profile?.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#1E1F22] border border-white/10 shadow-xs">
                      {getNotificationIcon(notif.type)}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-200 leading-snug">
                      {getNotificationText(notif)}
                    </p>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-zinc-950 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
