"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    resetToken?: string;
  }>({ loading: false });

  // Reset password state
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.data?.token) {
        login(data.data.token, data.data.user);
        router.push("/profile");
      } else {
        setErrorMsg(data.error?.message || "Invalid credentials. Please verify your details.");
      }
    } catch {
      setErrorMsg("Failed to connect to authentication server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotStatus({ loading: true });

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotStatus({
          loading: false,
          success: true,
          message: data.message || "Password recovery token generated.",
          resetToken: data.data?.resetToken, // Available in dev environment
        });
        if (data.data?.resetToken) {
          setResetToken(data.data.resetToken);
        }
      } else {
        setForgotStatus({
          loading: false,
          success: false,
          message: data.error?.message || "Unable to process password reset.",
        });
      }
    } catch {
      setForgotStatus({
        loading: false,
        success: false,
        message: "Failed to request password reset.",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    setResetLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setResetSuccess(true);
        setTimeout(() => {
          setShowForgotModal(false);
          setResetSuccess(false);
          setPassword(newPassword);
          setEmail(forgotEmail || email);
        }, 1500);
      } else {
        alert(data.error?.message || "Password reset failed.");
      }
    } catch {
      alert("Error resetting password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block relative h-14 w-36 mb-4">
            <Image
              src="/brand/poppin-logo.png"
              alt="Poppin."
              fill
              className="object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-extrabold text-poppin-navy tracking-tight">
            Welcome back to Poppin.
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Sign in to access your profile, connections, and feeds
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@poppin.social"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-poppin-lilac hover:text-poppin-lilac-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac rounded"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-poppin-navy text-white font-bold text-sm hover:bg-poppin-navy-light shadow-xs hover:shadow-md transition-all disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-poppin-lilac" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/v1/auth/google"
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-2xs hover:border-slate-400 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </a>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-poppin-lilac hover:text-poppin-lilac-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac rounded"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-poppin-navy font-bold text-lg">
                <KeyRound className="w-5 h-5 text-poppin-lilac" />
                <span>Recover Account Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Password successfully reset! Logging you in...</span>
              </div>
            ) : !forgotStatus.success ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter your registered email address to generate a secure recovery token.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your-email@poppin.social"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotStatus.loading}
                    className="px-5 py-2 rounded-xl bg-poppin-navy text-white font-bold text-sm hover:bg-poppin-navy-light disabled:opacity-60 flex items-center gap-2"
                  >
                    {forgotStatus.loading && <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />}
                    <span>Request Recovery</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                  Recovery token created! Enter your new password below.
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Recovery Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-poppin-lilac outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-xl bg-poppin-navy text-white font-bold text-sm hover:bg-poppin-navy-light flex items-center justify-center gap-2"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />}
                  <span>Set New Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

