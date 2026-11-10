"use client";

import React from "react";
import { NotificationList } from "@/components/notifications";

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-gray-500">
            Stay updated with likes, comments, mentions, follows, and messages.
          </p>
        </div>

        {/* Notifications Feed */}
        <NotificationList />
      </div>
    </main>
  );
}
