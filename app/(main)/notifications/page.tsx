"use client";

import React from "react";
import Link from "next/link";
import { NotificationList } from "@/components/notifications";
import { Bell, Settings } from "lucide-react";

export default function NotificationsPage() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-[#1E1F22] rounded-3xl p-6 border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5865F2]/15 text-[#8A9BFF] text-[11px] font-bold mb-2">
              <Bell className="w-3 h-3 text-[#5865F2]" />
              Activity
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time alerts for likes, comments, replies, follows, and direct messages.
            </p>
          </div>

          <Link
            href="/settings"
            className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition"
            title="Notification Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* Notifications Feed */}
        <div className="bg-[#1E1F22] rounded-3xl p-6 border border-white/10 shadow-lg text-[#F2F3F5]">
          <NotificationList />
        </div>
      </div>
    </main>
  );
}
