"use client";

import React from "react";
import Link from "next/link";
import { NotificationList } from "@/components/notifications";
import { Settings, Sparkles } from "lucide-react";

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-poppin-lilac/10 text-poppin-lilac text-[11px] font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              Activity Center
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time alerts for likes, comments, replies, follows, and direct messages.
            </p>
          </div>

          <Link
            href="/settings"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-poppin-navy hover:bg-slate-50 transition shadow-2xs"
            title="Notification Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* Notifications Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <NotificationList />
        </div>
      </div>
    </main>
  );
}
