"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NotificationResponse, NotificationType } from "@/types";

interface NotificationItemProps {
  notification: NotificationResponse;
  token?: string | null;
  onRead?: (id: string) => void;
}

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { action: string; icon: string; linkPrefix: string; iconColor: string }
> = {
  POST_LIKE: {
    action: "liked your post",
    icon: "❤️",
    linkPrefix: "/posts/",
    iconColor: "text-red-500",
  },
  POST_COMMENT: {
    action: "commented on your post",
    icon: "💬",
    linkPrefix: "/posts/",
    iconColor: "text-blue-500",
  },
  NEW_FOLLOWER: {
    action: "started following you",
    icon: "👤",
    linkPrefix: "/profiles/",
    iconColor: "text-emerald-500",
  },
  NEW_MESSAGE: {
    action: "sent you a message",
    icon: "✉️",
    linkPrefix: "/messages/",
    iconColor: "text-purple-500",
  },
};

export function NotificationItem({ notification, token, onRead }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.isRead);

  const config = NOTIFICATION_CONFIG[notification.type] || {
    action: "interacted with you",
    icon: "🔔",
    linkPrefix: "/",
    iconColor: "text-gray-500",
  };

  const handleMarkRead = async () => {
    if (isRead) return;
    setIsRead(true);

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/v1/notifications/${notification.id}/read`, {
        method: "PATCH",
        headers,
      });

      if (onRead) onRead(notification.id);
    } catch {
      // Ignore
    }
  };

  const initials = (notification.actor.displayName || notification.actor.username || "U")
    .slice(0, 2)
    .toUpperCase();

  const targetLink = notification.entityId
    ? `${config.linkPrefix}${notification.entityId}`
    : notification.type === "NEW_FOLLOWER"
    ? `/profiles/${encodeURIComponent(notification.actor.username || "")}`
    : "#";

  return (
    <div
      onClick={handleMarkRead}
      className={`flex items-start gap-3 p-3.5 rounded-xl transition-all cursor-pointer border ${
        isRead
          ? "bg-white border-gray-100 hover:bg-gray-50/80"
          : "bg-blue-50/40 border-blue-100 hover:bg-blue-50/70"
      }`}
    >
      {/* Actor Avatar */}
      <div className="relative shrink-0">
        {notification.actor.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={notification.actor.avatar}
            alt={notification.actor.username || "User"}
            className="w-9 h-9 rounded-full object-cover border border-gray-100"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-xs">{config.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-xs">
        <p className="text-gray-800 leading-snug">
          <Link
            href={`/profiles/${encodeURIComponent(notification.actor.username || "")}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-gray-900 hover:underline mr-1"
          >
            {notification.actor.displayName || notification.actor.username}
          </Link>
          <span>{config.action}</span>
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-3xs text-gray-400">
            {new Date(notification.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {notification.entityId && (
            <Link
              href={targetLink}
              onClick={(e) => e.stopPropagation()}
              className="text-3xs text-blue-600 hover:underline font-medium"
            >
              View details →
            </Link>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" title="Unread" />
      )}
    </div>
  );
}
