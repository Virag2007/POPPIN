"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NotificationResponse } from "@/types";
import { NotificationItem } from "./notification-item";
import { socketClient } from "@/lib/socket-client";

interface NotificationListProps {
  token?: string | null;
}

export function NotificationList({ token }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  const loadNotifications = useCallback(
    async (isInitial = true, nextCursor?: string | null) => {
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const query = new URLSearchParams();
        query.set("limit", "20");
        if (nextCursor) query.set("cursor", nextCursor);

        const [listRes, countRes] = await Promise.all([
          fetch(`/api/v1/notifications?${query.toString()}`, { headers: getHeaders() }),
          fetch("/api/v1/notifications/unread-count", { headers: getHeaders() }),
        ]);

        const listData = await listRes.json();
        const countData = await countRes.json();

        if (listRes.ok && listData.success) {
          if (isInitial) {
            setNotifications(listData.data.items);
          } else {
            setNotifications((prev) => [...prev, ...listData.data.items]);
          }
          setCursor(listData.data.nextCursor);
          setHasMore(listData.data.hasMore);
        }

        if (countRes.ok && countData.success) {
          setUnreadCount(countData.data.unreadCount);
        }
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [getHeaders]
  );

  useEffect(() => {
    loadNotifications(true);

    // Listen for live in-app notifications
    const unsubscribe = socketClient.on<NotificationResponse>("notification:new", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/v1/notifications/read-all", {
        method: "PATCH",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    }
  };

  const handleItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-sm">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-blue-600 text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-400">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base">
            🔔
          </div>
          You&apos;re all caught up! No notifications yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              token={token}
              onRead={handleItemRead}
            />
          ))}

          {hasMore && (
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => loadNotifications(false, cursor)}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? "Loading more..." : "Load More Notifications"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
