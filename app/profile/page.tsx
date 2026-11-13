/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SafeProfile, EducationItem, ExperienceItem, PostResponse } from "@/types";
import { PostCard } from "@/components/posts/post-card";
import { FollowersFollowingModal } from "@/components/profile/followers-following-modal";
import { FileUpload } from "@/components/ui/file-upload";
import { AvatarImage } from "@/components/ui/avatar-image";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Edit3,
  Plus,
  Trash2,
  Lock,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";

export default function OwnProfilePage() {
  const { user, token, updateProfileState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<SafeProfile | null>(null);

  // Tabs: Posts vs About
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Followers & Following Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"followers" | "following" | "requests">("followers");

  // Edit Profile Details Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modals for sub-collections
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [showEduModal, setShowEduModal] = useState(false);
  const [eduSchool, setEduSchool] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStart, setEduStart] = useState("");
  const [eduEnd, setEduEnd] = useState("");

  const [showExpModal, setShowExpModal] = useState(false);
  const [expCompany, setExpCompany] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expDesc, setExpDesc] = useState("");

  const fetchMyProfile = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfileData(data.data);
        setDisplayName(data.data.displayName || "");
        setHeadline(data.data.headline || "");
        setBio(data.data.bio || "");
        setLocation(data.data.location || "");
        setAvatar(data.data.avatar || "");
        setCoverImage(data.data.coverImage || "");

        // Also fetch authored posts
        setLoadingPosts(true);
        try {
          const postsRes = await fetch(`/api/v1/posts?authorId=${data.data.userId}&limit=20`);
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
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/v1/users/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          headline: headline.trim() || undefined,
          bio: bio.trim() || undefined,
          location: location.trim() || undefined,
          avatar: avatar.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setProfileData(data.data);
        updateProfileState(data.data);
        setSaveSuccess(true);
        setTimeout(() => {
          setShowEditModal(false);
          setSaveSuccess(false);
        }, 900);
      } else {
        setSaveError(data.error?.message || "Failed to update profile. Please verify your input.");
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving profile. Please check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl || !profileData) return;

    let normalizedUrl = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const updated = [...(profileData.links || []), { title: newLinkTitle.trim(), url: normalizedUrl }];

    try {
      const res = await fetch("/api/v1/users/me/profile/links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ links: updated }),
      });
      if (res.ok) {
        await fetchMyProfile();
        setShowLinkModal(false);
        setNewLinkTitle("");
        setNewLinkUrl("");
      }
    } catch {
      alert("Error saving link.");
    }
  };

  const handleDeleteLink = async (index: number) => {
    if (!profileData) return;
    const updated = profileData.links.filter((_, idx) => idx !== index);
    try {
      await fetch("/api/v1/users/me/profile/links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ links: updated }),
      });
      await fetchMyProfile();
    } catch {
      // Ignore
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool || !eduDegree || !profileData) return;

    const newItem: EducationItem = {
      id: "edu_" + Date.now(),
      school: eduSchool.trim(),
      degree: eduDegree.trim(),
      fieldOfStudy: eduField.trim() || undefined,
      startDate: eduStart.trim() || undefined,
      endDate: eduEnd.trim() || undefined,
    };

    const updated = [...(profileData.education || []), newItem];

    try {
      const res = await fetch("/api/v1/users/me/profile/education", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ education: updated }),
      });
      if (res.ok) {
        await fetchMyProfile();
        setShowEduModal(false);
        setEduSchool("");
        setEduDegree("");
        setEduField("");
        setEduStart("");
        setEduEnd("");
      }
    } catch {
      alert("Error saving education record.");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!profileData) return;
    const updated = profileData.education.filter((e) => e.id !== id);
    try {
      await fetch("/api/v1/users/me/profile/education", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ education: updated }),
      });
      await fetchMyProfile();
    } catch {
      // Ignore
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany || !expTitle || !profileData) return;

    const newItem: ExperienceItem = {
      id: "exp_" + Date.now(),
      company: expCompany.trim(),
      title: expTitle.trim(),
      location: expLocation.trim() || undefined,
      startDate: expStart.trim() || undefined,
      endDate: expEnd.trim() || undefined,
      description: expDesc.trim() || undefined,
    };

    const updated = [...(profileData.experience || []), newItem];

    try {
      const res = await fetch("/api/v1/users/me/profile/experience", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ experience: updated }),
      });
      if (res.ok) {
        await fetchMyProfile();
        setShowExpModal(false);
        setExpCompany("");
        setExpTitle("");
        setExpLocation("");
        setExpStart("");
        setExpEnd("");
        setExpDesc("");
      }
    } catch {
      alert("Error saving experience record.");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!profileData) return;
    const updated = profileData.experience.filter((e) => e.id !== id);
    try {
      await fetch("/api/v1/users/me/profile/experience", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ experience: updated }),
      });
      await fetchMyProfile();
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-[#B5BAC1]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5865F2]" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 text-[#F2F3F5]">
      {/* Profile Header Banner */}
      <div className="bg-[#2B2D31] rounded-2xl border border-white/10 shadow-lg overflow-hidden mb-8">
        {/* Cover Image */}
        <div className="h-44 sm:h-60 w-full bg-[#1E1F22] relative">
          {profileData?.coverImage ? (
            <img src={profileData.coverImage} alt="Profile Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#1E1F22] via-[#2B2D31] to-[#383A40]" />
          )}
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 bg-[#1E1F22]/80 backdrop-blur-md hover:bg-[#1E1F22] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center gap-1.5 border border-white/10"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Info Details */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#2B2D31] p-1.5 shadow-xl border-2 border-white/10 shrink-0">
              <AvatarImage
                src={profileData?.avatar}
                alt={profileData?.displayName || profileData?.username || "Avatar"}
                size="2xl"
                className="w-full h-full text-3xl sm:text-4xl"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <Link
                href={`/profiles/${profileData?.username || ""}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-[#F2F3F5] hover:bg-[#383A40] flex items-center gap-1.5 transition"
              >
                <span>Public View</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Name & Headline */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
                {profileData?.displayName || profileData?.username}
              </h1>
              {profileData?.isPrivate && (
                <span
                  className="p-1 rounded-md bg-[#383A40] text-zinc-400 border border-white/5"
                  title="Private Account"
                >
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#B5BAC1] font-mono mt-0.5">
              @{profileData?.username}
            </p>

            {profileData?.headline && (
              <p className="text-base text-zinc-200 mt-2 font-medium max-w-2xl font-sans">
                {profileData.headline}
              </p>
            )}

            {profileData?.bio && (
              <p className="text-sm text-[#B5BAC1] mt-3 whitespace-pre-line leading-relaxed max-w-2xl font-sans">
                {profileData.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400 mt-3 font-sans">
              {profileData?.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>{profileData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Followers & Following Stats (Instagram-Style Clickable) */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10 text-sm">
            <button
              type="button"
              onClick={() => {
                setModalTab("followers");
                setModalOpen(true);
              }}
              className="text-left group cursor-pointer transition"
            >
              <span className="text-base font-bold text-white font-mono group-hover:underline">
                {profileData?.followersCount || 0}
              </span>{" "}
              <span className="text-xs text-[#B5BAC1] font-medium">Followers</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalTab("following");
                setModalOpen(true);
              }}
              className="text-left group cursor-pointer transition"
            >
              <span className="text-base font-bold text-white font-mono group-hover:underline">
                {profileData?.followingCount || 0}
              </span>{" "}
              <span className="text-xs text-[#B5BAC1] font-medium">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content Tabs: Authored Posts & About */}
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
            My Posts ({posts.length})
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
            About & Experience
          </button>
        </div>

        {activeTab === "posts" ? (
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="py-12 text-center text-xs text-[#B5BAC1]">Loading your posts...</div>
            ) : posts.length === 0 ? (
              <div className="py-12 bg-[#2B2D31] rounded-2xl border border-white/10 text-center text-xs text-[#B5BAC1] p-8 shadow-lg">
                <p className="text-sm font-semibold text-white mb-2 font-heading">
                  You haven&apos;t published any posts yet.
                </p>
                <p className="text-xs text-[#B5BAC1] max-w-sm mx-auto mb-4 font-sans">
                  Share project updates, engineering insights, or design breakthroughs with the POPPIN community.
                </p>
                <Link
                  href="/feed"
                  className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl transition inline-block"
                >
                  Create a Post on Home Feed
                </Link>
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
          /* About Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Skills, Interests, Links */}
            <div className="space-y-6">
              {/* Skills */}
              <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] mb-3 font-heading">
                  Skills
                </h3>
                {profileData?.skills && profileData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-[#383A40] text-zinc-200 border border-white/5 rounded-xl text-xs font-medium font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B5BAC1]">No skills added yet.</p>
                )}
              </div>

              {/* Interests */}
              <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] mb-3 font-heading">
                  Interests
                </h3>
                {profileData?.interests && profileData.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2.5 py-1 bg-[#383A40] text-zinc-300 rounded-xl text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B5BAC1]">No interests added yet.</p>
                )}
              </div>

              {/* External Links */}
              <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#B5BAC1] font-heading">
                    Links
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="text-xs font-bold text-[#5865F2] hover:text-[#4752C4] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {profileData?.links && profileData.links.length > 0 ? (
                  <div className="space-y-2">
                    {profileData.links.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#383A40] text-xs border border-white/5"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white hover:text-[#5865F2] flex items-center gap-1.5 truncate max-w-[200px]"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{link.title}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(idx)}
                          className="text-zinc-400 hover:text-red-400 p-1"
                          title="Delete link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B5BAC1]">No external links added.</p>
                )}
              </div>
            </div>

            {/* Right Column: Experience & Education */}
            <div className="md:col-span-2 space-y-6">
              {/* Experience */}
              <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#5865F2]" />
                    <h3 className="text-sm font-bold text-white font-heading">Experience</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExpModal(true)}
                    className="text-xs font-bold text-[#5865F2] hover:text-[#4752C4] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                  </button>
                </div>

                {profileData?.experience && profileData.experience.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.experience.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3.5 rounded-xl bg-[#383A40] border border-white/5 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                ) : (
                  <p className="text-xs text-[#B5BAC1]">No experience records added.</p>
                )}
              </div>

              {/* Education */}
              <div className="bg-[#2B2D31] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#5865F2]" />
                    <h3 className="text-sm font-bold text-white font-heading">Education</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEduModal(true)}
                    className="text-xs font-bold text-[#5865F2] hover:text-[#4752C4] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>

                {profileData?.education && profileData.education.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-3.5 rounded-xl bg-[#383A40] border border-white/5 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(edu.id)}
                          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                ) : (
                  <p className="text-xs text-[#B5BAC1]">No education records added.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Followers & Following Instagram-Style Modal */}
      {modalOpen && profileData && (
        <FollowersFollowingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={profileData.userId}
          username={profileData.username}
          initialTab={modalTab}
          isOwnProfile={true}
          isPrivate={profileData.isPrivate}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#2B2D31] w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 text-white max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold font-heading text-white">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 mb-4 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs flex items-center gap-2 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Profile updated successfully!
              </div>
            )}

            {saveError && (
              <div className="p-3 mb-4 bg-rose-500/10 text-rose-300 rounded-xl text-xs flex items-center gap-2 border border-rose-500/20">
                <X className="w-4 h-4 shrink-0 text-rose-400" />
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#B5BAC1] block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B5BAC1] block mb-1">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Distributed Systems Engineer"
                  className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B5BAC1] block mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about what you craft and build..."
                  className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B5BAC1] block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA / Remote"
                  className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <FileUpload
                  label="Profile Picture"
                  currentValue={avatar}
                  onUploadSuccess={(file) => setAvatar(file.url)}
                  onRemove={() => setAvatar("")}
                  token={token}
                />
              </div>

              <div>
                <FileUpload
                  label="Cover Banner"
                  currentValue={coverImage}
                  onUploadSuccess={(file) => setCoverImage(file.url)}
                  onRemove={() => setCoverImage("")}
                  token={token}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs text-[#B5BAC1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#2B2D31] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 text-white">
            <h3 className="text-sm font-bold font-heading mb-3">Add External Link</h3>
            <form onSubmit={handleAddLink} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub / Personal Site"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-xs text-[#B5BAC1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl"
                >
                  Add Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Experience Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#2B2D31] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 text-white">
            <h3 className="text-sm font-bold font-heading mb-3">Add Experience</h3>
            <form onSubmit={handleAddExperience} className="space-y-3">
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Engineer"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">Company</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vercel"
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#B5BAC1] block mb-1">Start Date</label>
                  <input
                    type="text"
                    placeholder="2022"
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#B5BAC1] block mb-1">End Date</label>
                  <input
                    type="text"
                    placeholder="Present"
                    value={expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="px-4 py-2 text-xs text-[#B5BAC1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Education Modal */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#2B2D31] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 text-white">
            <h3 className="text-sm font-bold font-heading mb-3">Add Education</h3>
            <form onSubmit={handleAddEducation} className="space-y-3">
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">School / Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={eduSchool}
                  onChange={(e) => setEduSchool(e.target.value)}
                  className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">Degree</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.S."
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#B5BAC1] block mb-1">Field of Study</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={eduField}
                  onChange={(e) => setEduField(e.target.value)}
                  className="w-full p-2 bg-[#383A40] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEduModal(false)}
                  className="px-4 py-2 text-xs text-[#B5BAC1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl"
                >
                  Save Education
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
