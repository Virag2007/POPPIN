/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SafeProfile, PostResponse } from "@/types";
import { PostCard } from "@/components/posts/post-card";
import { FollowersFollowingModal } from "@/components/profile/followers-following-modal";
import { AvatarImage } from "@/components/ui/avatar-image";
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
  ExternalLink,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername);

  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SafeProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Relationship status
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Authored posts
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

  // Followers & Following Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"followers" | "following">("followers");

  // Safety & Moderation Menu
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchProfileAndPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/profiles/${encodeURIComponent(username)}`);
      const data = await res.json();

      if (data.success && data.data) {
        const prof: SafeProfile = data.data;
        setProfile(prof);

        // Fetch relationship status if logged in
        if (user && user.id !== prof.userId) {
          const relRes = await fetch(`/api/v1/users/${prof.userId}/relationship`);
          const relData = await relRes.json();
          if (relRes.ok && relData.success) {
            setIsFollowing(relData.data.isFollowing);
            setIsRequested(relData.data.isRequested);
          }
        }

        // Fetch authored posts if account is not private or viewer is authorized
        if (!prof.isPrivate || (user && user.id === prof.userId) || isFollowing) {
          setLoadingPosts(true);
          try {
            const postsRes = await fetch(`/api/v1/posts?authorId=${prof.userId}&limit=20`);
            const postsData = await postsRes.json();
            if (postsRes.ok && postsData.success) {
              setPosts(postsData.data?.items || []);
            }
          } catch {
            // Handled silently
          } finally {
            setLoadingPosts(false);
          }
        }
      } else {
        setErrorMsg(data.error?.message || "User profile not found.");
      }
    } catch {
      setErrorMsg("Failed to connect to profile service.");
    } finally {
      setLoading(false);
    }
  }, [username, user, isFollowing]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  const handleFollowToggle = async () => {
    if (!profile || !user) {
      router.push(`/login?next=/profiles/${username}`);
      return;
    }
    setFollowLoading(true);

    try {
      if (isFollowing) {
        const res = await fetch(`/api/v1/users/${profile.userId}/follow`, { method: "DELETE" });
        if (res.ok) {
          setIsFollowing(false);
          setIsRequested(false);
          setProfile((prev) =>
            prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : null
          );
        }
      } else if (isRequested) {
        // Cancel follow request
        const res = await fetch(`/api/v1/users/${profile.userId}/follow-request`, { method: "DELETE" });
        if (res.ok) {
          setIsRequested(false);
        }
      } else {
        // Follow / Request to follow
        const res = await fetch(`/api/v1/users/${profile.userId}/follow`, { method: "POST" });
        const json = await res.json();
        if (res.ok && json.success) {
          if (json.data?.status === "REQUESTED") {
            setIsRequested(true);
            setIsFollowing(false);
          } else {
            setIsFollowing(true);
            setIsRequested(false);
            setProfile((prev) => (prev ? { ...prev, followersCount: prev.followersCount + 1 } : null));
            // Reload posts if profile was private and now followed
            fetchProfileAndPosts();
          }
        }
      }
    } catch {
      // Reconcile on error
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    if (!confirm(`Are you sure you want to block @${profile.username}?`)) return;

    try {
      const res = await fetch(`/api/v1/users/${profile.userId}/block`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`You have blocked @${profile.username}.`);
        router.push("/feed");
      }
    } catch {
      alert("Error communicating with block endpoint.");
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const res = await fetch(`/api/v1/users/${profile.userId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportDetails("");
        }, 1200);
      }
    } catch {
      alert("Error submitting report.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-[#B5BAC1]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5865F2]" />
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#F2F3F5]">
        <AlertTriangle className="w-10 h-10 text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold font-heading text-white">Profile Not Found</h2>
        <p className="mt-2 text-[#B5BAC1] text-sm max-w-sm font-sans">
          {errorMsg || "This user account does not exist or may have been deactivated."}
        </p>
        <Link
          href="/feed"
          className="mt-5 px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl text-xs transition shadow-xs"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.userId;
  const isPrivateLocked = profile.isPrivate && !isOwnProfile && !isFollowing;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 text-[#F2F3F5]">
      {/* Profile Header Banner Card */}
      <div className="bg-[#2B2D31] rounded-2xl border border-white/10 shadow-lg overflow-hidden mb-8">
        {/* Cover Image */}
        <div className="h-44 sm:h-60 w-full bg-[#1E1F22] relative">
          {profile.coverImage ? (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#1E1F22] via-[#2B2D31] to-[#383A40]" />
          )}

          {/* Safety & Action Menu */}
          {!isOwnProfile && user && (
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="bg-[#1E1F22]/80 backdrop-blur-md hover:bg-[#1E1F22] text-white p-2 rounded-xl shadow-md border border-white/10 transition"
                aria-label="User Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-[#1E1F22] rounded-xl shadow-xl border border-white/10 py-1.5 z-20 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Report User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleBlockUser();
                    }}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
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
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#2B2D31] p-1.5 shadow-xl border-2 border-white/10 shrink-0">
              <AvatarImage
                src={profile.avatar}
                alt={profile.displayName || profile.username || "Avatar"}
                size="2xl"
                className="w-full h-full text-3xl sm:text-4xl"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition shadow-xs"
                >
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                      isFollowing
                        ? "bg-[#383A40] text-[#F2F3F5] hover:bg-red-500/10 hover:text-red-400"
                        : isRequested
                        ? "bg-[#383A40] text-amber-300 hover:bg-[#313338]"
                        : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-[#5865F2]" />
                        <span>Following</span>
                      </>
                    ) : isRequested ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>Requested</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/messages?user=${profile.userId}`}
                    className="px-4 py-2.5 rounded-xl bg-[#383A40] text-[#F2F3F5] hover:bg-white/10 text-xs font-bold transition flex items-center gap-1.5 border border-white/5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
                    <span>Message</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
                {profile.displayName || profile.username}
              </h1>
              {profile.isPrivate && (
                <span
                  className="p-1 rounded-md bg-[#383A40] text-zinc-400 border border-white/5"
                  title="Private Account"
                >
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#B5BAC1] font-mono mt-0.5">
              @{profile.username}
            </p>

            {profile.headline && (
              <p className="text-base text-zinc-200 mt-2 font-medium max-w-2xl font-sans">
                {profile.headline}
              </p>
            )}

            {profile.bio && (
              <p className="text-sm text-[#B5BAC1] mt-3 whitespace-pre-line leading-relaxed max-w-2xl font-sans">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400 mt-3 font-sans">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Followers & Following Counts (Instagram-Style Clickable) */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10 text-sm">
            <button
              type="button"
              disabled={isPrivateLocked}
              onClick={() => {
                setModalTab("followers");
                setModalOpen(true);
              }}
              className="text-left group transition disabled:opacity-60 cursor-pointer disabled:cursor-default"
            >
              <span className="text-base font-bold text-white font-mono group-hover:underline">
                {profile.followersCount}
              </span>{" "}
              <span className="text-xs text-[#B5BAC1] font-medium">Followers</span>
            </button>

            <button
              type="button"
              disabled={isPrivateLocked}
              onClick={() => {
                setModalTab("following");
                setModalOpen(true);
              }}
              className="text-left group transition disabled:opacity-60 cursor-pointer disabled:cursor-default"
            >
              <span className="text-base font-bold text-white font-mono group-hover:underline">
                {profile.followingCount}
              </span>{" "}
              <span className="text-xs text-[#B5BAC1] font-medium">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Private Profile Lock Screen */}
      {isPrivateLocked ? (
        <div className="p-12 bg-[#2B2D31] rounded-2xl border border-white/10 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-[#383A40] text-[#5865F2] flex items-center justify-center mx-auto mb-3 border border-white/10">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-heading">This Account is Private</h3>
          <p className="text-xs text-[#B5BAC1] mt-1.5 max-w-sm mx-auto leading-relaxed font-sans">
            Follow @{profile.username} to view their authored posts, followers list, and profile insights.
          </p>
        </div>
      ) : (
        /* Unlocked Content Tabs: Authored Posts & About */
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition ${
                activeTab === "posts"
                  ? "bg-[#5865F2] text-white"
                  : "text-[#B5BAC1] hover:text-white hover:bg-[#383A40]"
              }`}
            >
              Authored Posts ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition ${
                activeTab === "about"
                  ? "bg-[#5865F2] text-white"
                  : "text-[#B5BAC1] hover:text-white hover:bg-[#383A40]"
              }`}
            >
              About & Credentials
            </button>
          </div>

          {activeTab === "posts" ? (
            <div className="space-y-4">
              {loadingPosts ? (
                <div className="py-12 text-center text-xs text-[#B5BAC1]">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="py-12 bg-[#2B2D31] rounded-2xl border border-white/10 text-center text-xs text-[#B5BAC1]">
                  @{profile.username} hasn&apos;t published any posts yet.
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    token={token}
                    onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                  />
                ))
              )}
            </div>
          ) : (
            /* About Section */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Skills, Interests, Links */}
              <div className="space-y-6">
                {profile.skills && profile.skills.length > 0 && (
                  <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] mb-3 font-heading">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-[#383A40] text-zinc-200 border border-white/5 rounded-xl text-xs font-medium font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] mb-3 font-heading">
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 bg-[#383A40] text-zinc-300 rounded-xl text-xs font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.links && profile.links.length > 0 && (
                  <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] mb-3 font-heading">
                      Links
                    </h3>
                    <div className="space-y-2">
                      {profile.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#383A40] hover:bg-[#313338] transition text-xs font-medium text-white group border border-white/5"
                        >
                          <span className="truncate">{link.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Experience & Education */}
              <div className="md:col-span-2 space-y-6">
                {profile.experience && profile.experience.length > 0 && (
                  <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="w-4 h-4 text-[#5865F2]" />
                      <h3 className="text-sm font-bold text-white font-heading">Experience</h3>
                    </div>
                    <div className="space-y-3">
                      {profile.experience.map((exp) => (
                        <div key={exp.id} className="p-3.5 rounded-xl bg-[#383A40] border border-white/5">
                          <h4 className="font-bold text-white text-xs font-heading">{exp.title}</h4>
                          <p className="text-xs font-medium text-[#B5BAC1] mt-0.5">
                            {exp.company} {exp.location && `• ${exp.location}`}
                          </p>
                          {(exp.startDate || exp.endDate) && (
                            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                              {exp.startDate} - {exp.endDate || "Present"}
                            </p>
                          )}
                          {exp.description && (
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-sans">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.education && profile.education.length > 0 && (
                  <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="w-4 h-4 text-[#5865F2]" />
                      <h3 className="text-sm font-bold text-white font-heading">Education</h3>
                    </div>
                    <div className="space-y-3">
                      {profile.education.map((edu) => (
                        <div key={edu.id} className="p-3.5 rounded-xl bg-[#383A40] border border-white/5">
                          <h4 className="font-bold text-white text-xs font-heading">{edu.school}</h4>
                          <p className="text-xs font-medium text-[#B5BAC1] mt-0.5">
                            {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                          </p>
                          {(edu.startDate || edu.endDate) && (
                            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
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
        </div>
      )}

      {/* Followers & Following Instagram-Style Modal */}
      {modalOpen && (
        <FollowersFollowingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={profile.userId}
          username={profile.username}
          initialTab={modalTab}
          isOwnProfile={isOwnProfile}
          isPrivate={profile.isPrivate}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#2B2D31] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold font-heading mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-400" />
              <span>Report @{profile.username}</span>
            </h3>
            {reportSuccess ? (
              <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs text-center border border-emerald-500/20">
                Report submitted successfully. Thank you for keeping POPPIN safe.
              </div>
            ) : (
              <form onSubmit={handleReportUser} className="space-y-3.5">
                <div>
                  <label className="text-xs text-[#B5BAC1] block mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  >
                    <option value="SPAM">Spam or deceptive behavior</option>
                    <option value="HARASSMENT">Harassment or toxicity</option>
                    <option value="IMPERSONATION">Impersonation</option>
                    <option value="OTHER">Other violation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#B5BAC1] block mb-1">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context..."
                    className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-xs text-[#B5BAC1] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition"
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
