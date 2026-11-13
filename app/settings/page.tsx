"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Lock,
  Mail,
  UserX,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  Tag,
} from "lucide-react";

interface BlockedUserItem {
  id: string;
  username: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"account" | "privacy" | "safety">("account");

  // Account State
  const [email, setEmail] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Privacy State
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [privacySuccess, setPrivacySuccess] = useState(false);

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);

  // Delete Account Dialog
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function loadSettings() {
      try {
        // 1. Load Account
        const accRes = await fetch("/api/v1/users/me/account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const accData = await accRes.json();
        if (accData.success && accData.data) {
          setEmail(accData.data.email);
        }

        // 2. Load Privacy
        const privRes = await fetch("/api/v1/users/me/privacy", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const privData = await privRes.json();
        if (privData.success && privData.data) {
          setIsPrivate(!!privData.data.isPrivate);
          setShowActivityStatus(!!privData.data.showActivityStatus);
          setAllowTagging(!!privData.data.allowTagging);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [token]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSaving(true);
    setAccountError(null);

    try {
      const res = await fetch("/api/v1/users/me/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (data.success) {
        setAccountSuccess(true);
        setTimeout(() => setAccountSuccess(false), 2000);
      } else {
        setAccountError(data.error?.message || "Failed to update email.");
      }
    } catch {
      setAccountError("Server connection failed.");
    } finally {
      setAccountSaving(false);
    }
  };

  const handleTogglePrivacy = async (key: "isPrivate" | "showActivityStatus" | "allowTagging") => {
    let nextPrivate = isPrivate;
    let nextActivity = showActivityStatus;
    let nextTagging = allowTagging;

    if (key === "isPrivate") nextPrivate = !isPrivate;
    if (key === "showActivityStatus") nextActivity = !showActivityStatus;
    if (key === "allowTagging") nextTagging = !allowTagging;

    setIsPrivate(nextPrivate);
    setShowActivityStatus(nextActivity);
    setAllowTagging(nextTagging);

    try {
      const res = await fetch("/api/v1/users/me/privacy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPrivate: nextPrivate,
          showActivityStatus: nextActivity,
          allowTagging: nextTagging,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPrivacySuccess(true);
        setTimeout(() => setPrivacySuccess(false), 1500);
      }
    } catch {
      // Revert if error
    }
  };

  const handleUnblockUser = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/v1/users/${targetUserId}/block`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);

    try {
      const res = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await logout();
        router.push("/");
      } else {
        alert("Failed to delete account.");
      }
    } catch {
      alert("Error deleting account.");
    } finally {
      setDeleting(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FCFBF9]">
        <h2 className="text-xl font-bold text-zinc-900 font-display">Please sign in to access settings</h2>
        <Link
          href="/login"
          className="mt-4 px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl text-sm hover:bg-zinc-800 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-[#FCFBF9]">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight font-display">
          Settings & Account Safety
        </h1>
        <p className="mt-1 text-sm text-zinc-600 font-sans">
          Manage your credentials, visibility controls, and security preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`w-full min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
              activeTab === "account"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`w-full min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
              activeTab === "privacy"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy & Visibility</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("safety")}
            className={`w-full min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
              activeTab === "safety"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Safety & Blocks</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3">
          {/* TAB: Account */}
          {activeTab === "account" && (
            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Account Details
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update your contact email and account credentials
                </p>
              </div>

              {accountError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs font-medium rounded-xl border border-red-200">
                  {accountError}
                </div>
              )}

              {accountSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Email address updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={accountSaving}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {accountSaving && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                  <span>Save Email</span>
                </button>
              </form>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
                  Danger Zone
                </h4>
                <p className="text-xs text-zinc-500 mb-4 font-sans">
                  Permanently delete your account, public profile, followers, and all associated data. This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: Privacy */}
          {activeTab === "privacy" && (
            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Privacy & Visibility
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Control who can see your personal sub-collections and online activity
                </p>
              </div>

              {privacySuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Privacy preferences updated!</span>
                </div>
              )}

              <div className="divide-y divide-zinc-100">
                {/* Private Account Switch */}
                <div className="py-4 flex items-center justify-between">
                  <div className="max-w-md pr-4">
                    <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-700" />
                      <span>Private Account</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 font-sans">
                      When enabled, your bio, skills, experience, and follower lists are shielded from people who do not follow you.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePrivacy("isPrivate")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                      isPrivate ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        isPrivate ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Activity Status Switch */}
                <div className="py-4 flex items-center justify-between">
                  <div className="max-w-md pr-4">
                    <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-zinc-700" />
                      <span>Show Activity Status</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 font-sans">
                      Allow fellow members to see when you are active on the platform.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePrivacy("showActivityStatus")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                      showActivityStatus ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        showActivityStatus ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Allow Tagging Switch */}
                <div className="py-4 flex items-center justify-between">
                  <div className="max-w-md pr-4">
                    <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-zinc-700" />
                      <span>Allow Tagging in Discussions</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 font-sans">
                      Allow other community members to mention or tag @{user?.email.split("@")[0]} in posts and threads.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePrivacy("allowTagging")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                      allowTagging ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        allowTagging ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Safety & Blocks */}
          {activeTab === "safety" && (
            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Safety & Blocked Users
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage accounts you have blocked from viewing your profile and interacting with you
                </p>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <Shield className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-900">No Blocked Users</p>
                  <p className="text-xs text-zinc-500 mt-0.5 font-sans">
                    Your safety list is empty. You can block any user directly from their public profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs"
                    >
                      <span className="font-semibold text-zinc-900">@{b.username}</span>
                      <button
                        type="button"
                        onClick={() => handleUnblockUser(b.id)}
                        className="px-3 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-100 transition"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-xl border border-red-200">
            <div className="flex items-center gap-2.5 text-red-600 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Permanently Delete Account?</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed mb-4 font-sans">
              This action cannot be undone. All your followers, following connections, profile details, and identity records will be permanently erased.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
