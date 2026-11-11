/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SafeProfile } from "@/types";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  UserCheck,
  UserPlus,
  Lock,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Flag,
  MoreVertical,
  X,
  ExternalLink,
} from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername);

  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SafeProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Safety & Moderation Menu
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/profiles/${encodeURIComponent(username)}`, { headers });
      const data = await res.json();

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        setErrorMsg(data.error?.message || "User profile not found.");
      }
    } catch {
      setErrorMsg("Failed to connect to profile service.");
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!profile || !token) return;
    setFollowLoading(true);

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/v1/users/${profile.userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followersCount: isFollowing
                  ? Math.max(0, prev.followersCount - 1)
                  : prev.followersCount + 1,
              }
            : null
        );
      } else {
        alert(data.error?.message || "Could not update follow status.");
      }
    } catch {
      alert("Error updating follow connection.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!profile || !token) return;
    if (!confirm(`Are you sure you want to block @${profile.username}? This will sever all follow connections.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/users/${profile.userId}/block`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert(`User @${profile.username} has been blocked.`);
        window.location.href = "/";
      } else {
        alert(data.error?.message || "Could not block user.");
      }
    } catch {
      alert("Error blocking user.");
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !token) return;

    try {
      const res = await fetch(`/api/v1/users/${profile.userId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });
      const data = await res.json();
      if (data.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportDetails("");
        }, 1200);
      } else {
        alert(data.error?.message || "Could not submit report.");
      }
    } catch {
      alert("Error submitting report.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-poppin-lilac" />
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-poppin-navy">Profile Not Found</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-sm">
          {errorMsg || "This user account does not exist or may have been deactivated."}
        </p>
        <Link
          href="/"
          className="mt-5 px-6 py-2.5 bg-poppin-navy text-white font-bold rounded-xl text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.userId;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        {/* Cover Image */}
        <div className="h-44 sm:h-64 w-full bg-gradient-to-r from-poppin-navy via-poppin-navy-light to-poppin-lilac relative">
          {profile.coverImage && (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          )}

          {/* Safety Menu */}
          {!isOwnProfile && token && (
            <div className="absolute top-4 right-4 relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="bg-white/90 backdrop-blur-xs hover:bg-white text-poppin-navy p-2 rounded-xl shadow-xs transition-all"
                aria-label="User Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Report User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleBlockUser();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Block @{profile.username}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Info Details */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white p-1.5 shadow-md">
              <div className="w-full h-full rounded-full bg-poppin-lilac-light text-poppin-lilac font-black flex items-center justify-center text-3xl sm:text-4xl overflow-hidden border border-poppin-lilac-border">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.displayName || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-poppin-navy text-white text-xs font-bold hover:bg-poppin-navy-light inline-flex items-center gap-1.5"
                >
                  Manage My Profile
                </Link>
              ) : token ? (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`min-h-[42px] px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                    isFollowing
                      ? "bg-slate-100 text-slate-800 hover:bg-rose-50 hover:text-rose-600"
                      : "bg-poppin-navy text-white hover:bg-poppin-navy-light"
                  }`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-poppin-lilac" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-poppin-navy text-white text-xs font-bold hover:bg-poppin-navy-light inline-flex items-center gap-1.5"
                >
                  Sign in to Follow
                </Link>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-poppin-navy tracking-tight">
                {profile.displayName || profile.username}
              </h1>
              {profile.isPrivate && (
                <span className="p-1 rounded-md bg-slate-100 text-slate-500" title="Private Account">
                  <Lock className="w-4 h-4" />
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-poppin-lilac mt-0.5">@{profile.username}</p>

            {profile.headline && (
              <p className="text-base text-slate-700 mt-2 font-medium max-w-2xl">
                {profile.headline}
              </p>
            )}

            {profile.bio && (
              <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            {profile.location && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Counts */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100 text-sm">
            <div>
              <span className="text-lg font-black text-poppin-navy">{profile.followersCount}</span>{" "}
              <span className="text-xs font-bold text-slate-500">Followers</span>
            </div>
            <div>
              <span className="text-lg font-black text-poppin-navy">{profile.followingCount}</span>{" "}
              <span className="text-xs font-bold text-slate-500">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* If Private & Shielded */}
      {profile.isPrivate && !isOwnProfile && (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center mb-8">
          <Lock className="w-8 h-8 text-poppin-lilac mx-auto mb-2" />
          <h3 className="text-base font-bold text-poppin-navy">This account is private</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Follow @{profile.username} to view their full bio, skills, professional experience, and education.
          </p>
        </div>
      )}

      {/* Sub-Collections */}
      {(!profile.isPrivate || isOwnProfile) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Skills, Interests, Links */}
          <div className="space-y-6">
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-poppin-lilac-light text-poppin-navy border border-poppin-lilac-border rounded-full text-xs font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.links && profile.links.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Links
                </h3>
                <div className="space-y-2.5">
                  {profile.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-xs font-bold text-poppin-navy group"
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-poppin-lilac" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Experience & Education */}
          <div className="md:col-span-2 space-y-6">
            {profile.experience && profile.experience.length > 0 && (
              <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-poppin-lilac" />
                  <h3 className="text-lg font-bold text-poppin-navy">Experience</h3>
                </div>
                <div className="space-y-4">
                  {profile.experience.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white"
                    >
                      <h4 className="font-bold text-poppin-navy text-sm">{exp.title}</h4>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {exp.company} {exp.location && `• ${exp.location}`}
                      </p>
                      {(exp.startDate || exp.endDate) && (
                        <p className="text-2xs text-slate-400 mt-1">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.education && profile.education.length > 0 && (
              <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-poppin-lilac" />
                  <h3 className="text-lg font-bold text-poppin-navy">Education</h3>
                </div>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white"
                    >
                      <h4 className="font-bold text-poppin-navy text-sm">{edu.school}</h4>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </p>
                      {(edu.startDate || edu.endDate) && (
                        <p className="text-2xs text-slate-400 mt-1">
                          {edu.startDate} - {edu.endDate || "Present"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-poppin-navy flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-600" />
                <span>Report @{profile.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-sm font-semibold rounded-2xl">
                Report submitted successfully. Our safety team will review it.
              </div>
            ) : (
              <form onSubmit={handleReportUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-poppin-lilac"
                  >
                    <option value="SPAM">Spam or unwanted promotion</option>
                    <option value="HARASSMENT">Harassment or bullying</option>
                    <option value="HATE_SPEECH">Hate speech or symbols</option>
                    <option value="IMPERSONATION">Impersonation</option>
                    <option value="OTHER">Other violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for moderators..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-poppin-navy text-white text-sm font-bold rounded-xl"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

