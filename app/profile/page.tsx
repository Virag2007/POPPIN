/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SafeProfile, EducationItem, ExperienceItem } from "@/types";
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

interface ConnectionItem {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

export default function OwnProfilePage() {
  const { user, token, updateProfileState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<SafeProfile | null>(null);

  // Edit Profile Details Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [avatarDrag, setAvatarDrag] = useState(false);
  const [coverDrag, setCoverDrag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Followers / Following dialog
  const [connectionsModal, setConnectionsModal] = useState<"followers" | "following" | null>(null);
  const [connectionsList, setConnectionsList] = useState<ConnectionItem[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Fetch full profile
  const fetchMyProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfileData(data.data);
        updateProfileState(data.data);
        setDisplayName(data.data.displayName || "");
        setHeadline(data.data.headline || "");
        setBio(data.data.bio || "");
        setLocation(data.data.location || "");
        setAvatar(data.data.avatar || "");
        setCoverImage(data.data.coverImage || "");
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [token, updateProfileState]);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  // Load followers/following list
  const loadConnections = async (type: "followers" | "following") => {
    setConnectionsModal(type);
    setConnectionsLoading(true);
    try {
      const res = await fetch(`/api/v1/users/me/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConnectionsList(data.data);
      }
    } catch {
      setConnectionsList([]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/users/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          avatar: avatar.trim(),
          coverImage: coverImage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMyProfile();
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowEditModal(false);
        }, 800);
      } else {
        alert(data.error?.message || "Failed to update profile.");
      }
    } catch {
      alert("Error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add Link
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl || !profileData) return;

    let urlToSave = newLinkUrl.trim();
    if (!urlToSave.startsWith("http://") && !urlToSave.startsWith("https://")) {
      urlToSave = "https://" + urlToSave;
    }

    const updatedLinks = [...(profileData.links || []), { title: newLinkTitle.trim(), url: urlToSave }];

    try {
      const res = await fetch("/api/v1/users/me/profile/links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ links: updatedLinks }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMyProfile();
        setShowLinkModal(false);
        setNewLinkTitle("");
        setNewLinkUrl("");
      } else {
        alert(data.error?.message || "Failed to add link.");
      }
    } catch {
      alert("Error saving link.");
    }
  };

  const handleDeleteLink = async (index: number) => {
    if (!profileData) return;
    const updatedLinks = profileData.links.filter((_, i) => i !== index);
    try {
      const res = await fetch("/api/v1/users/me/profile/links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ links: updatedLinks }),
      });
      if (res.ok) await fetchMyProfile();
    } catch {
      // Ignore
    }
  };

  // Add Education
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool || !profileData) return;

    const newItem: EducationItem = {
      id: "edu_" + Date.now(),
      school: eduSchool.trim(),
      degree: eduDegree.trim() || undefined,
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

  // Add Experience
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

  if (!user && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-poppin-navy">Sign in to view your profile</h2>
        <Link
          href="/login"
          className="mt-4 px-6 py-2.5 bg-poppin-navy text-white font-bold rounded-xl text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Cover Banner & Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        {/* Cover Image */}
        <div className="h-44 sm:h-64 w-full bg-gradient-to-r from-poppin-navy via-poppin-navy-light to-poppin-lilac relative">
          {profileData?.coverImage && (
            <img
              src={profileData.coverImage}
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs hover:bg-white text-poppin-navy text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white p-1.5 shadow-md">
              <div className="w-full h-full rounded-full bg-poppin-lilac-light text-poppin-lilac font-black flex items-center justify-center text-3xl sm:text-4xl overflow-hidden border border-poppin-lilac-border">
                {profileData?.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt={profileData.displayName || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData?.username?.slice(0, 2).toUpperCase() || "P"
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <Link
                href={`/profiles/${profileData?.username || ""}`}
                target="_blank"
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <span>Public View</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-poppin-navy text-white text-xs font-bold hover:bg-poppin-navy-light flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-poppin-lilac" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Name & Headline */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-poppin-navy tracking-tight">
                {profileData?.displayName || profileData?.username}
              </h1>
              {profileData?.isPrivate && (
                <span title="Private Account">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-poppin-lilac mt-0.5">@{profileData?.username}</p>

            {profileData?.headline && (
              <p className="text-base text-slate-700 mt-2 font-medium max-w-2xl">
                {profileData.headline}
              </p>
            )}

            {profileData?.bio && (
              <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed max-w-2xl">
                {profileData.bio}
              </p>
            )}

            {profileData?.location && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{profileData.location}</span>
              </div>
            )}
          </div>

          {/* Followers & Following Stats */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => loadConnections("followers")}
              className="text-left group"
            >
              <span className="text-lg font-black text-poppin-navy group-hover:text-poppin-lilac transition-colors">
                {profileData?.followersCount || 0}
              </span>{" "}
              <span className="text-xs font-bold text-slate-500">Followers</span>
            </button>
            <button
              type="button"
              onClick={() => loadConnections("following")}
              className="text-left group"
            >
              <span className="text-lg font-black text-poppin-navy group-hover:text-poppin-lilac transition-colors">
                {profileData?.followingCount || 0}
              </span>{" "}
              <span className="text-xs font-bold text-slate-500">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Skills, Interests, Links */}
        <div className="space-y-6">
          {/* Skills Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
              Skills
            </h3>
            {profileData?.skills && profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-poppin-lilac-light text-poppin-navy border border-poppin-lilac-border rounded-full text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No skills added yet.</p>
            )}
          </div>

          {/* Interests Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
              Interests
            </h3>
            {profileData?.interests && profileData.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No interests added yet.</p>
            )}
          </div>

          {/* External Links Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Links</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="text-xs font-bold text-poppin-lilac hover:text-poppin-lilac-hover flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {profileData?.links && profileData.links.length > 0 ? (
              <div className="space-y-2.5">
                {profileData.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-xs"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-poppin-navy hover:text-poppin-lilac flex items-center gap-1.5 truncate max-w-[200px]"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{link.title}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No external links added.</p>
            )}
          </div>
        </div>

        {/* Right Column: Experience & Education Timeline */}
        <div className="md:col-span-2 space-y-6">
          {/* Experience Section */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-poppin-lilac" />
                <h2 className="text-lg font-extrabold text-poppin-navy tracking-tight">Experience</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowExpModal(true)}
                className="text-xs font-bold text-poppin-lilac hover:text-poppin-lilac-hover flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Position</span>
              </button>
            </div>

            {profileData?.experience && profileData.experience.length > 0 ? (
              <div className="space-y-4">
                {profileData.experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="absolute top-3.5 right-3.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-poppin-navy text-sm">{exp.title}</h4>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {exp.company} {exp.location && `• ${exp.location}`}
                    </p>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-2xs text-slate-400 mt-1 font-medium">
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
            ) : (
              <p className="text-xs text-slate-500 py-3">No experience records added.</p>
            )}
          </div>

          {/* Education Section */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-poppin-lilac" />
                <h2 className="text-lg font-extrabold text-poppin-navy tracking-tight">Education</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEduModal(true)}
                className="text-xs font-bold text-poppin-lilac hover:text-poppin-lilac-hover flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education</span>
              </button>
            </div>

            {profileData?.education && profileData.education.length > 0 ? (
              <div className="space-y-4">
                {profileData.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="absolute top-3.5 right-3.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-poppin-navy text-sm">{edu.school}</h4>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </p>
                    {(edu.startDate || edu.endDate) && (
                      <p className="text-2xs text-slate-400 mt-1 font-medium">
                        {edu.startDate} - {edu.endDate || "Present"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No education records added.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-poppin-navy">Edit Profile Details</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-poppin-lilac outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={160}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-poppin-lilac outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-poppin-lilac outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-poppin-lilac outline-none"
                />
              </div>

              {/* Avatar Upload (Drag & Drop or File Select) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Profile avatar
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setAvatarDrag(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setAvatarDrag(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setAvatarDrag(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      setIsUploadingAvatar(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const headers: Record<string, string> = {};
                        if (token) headers["Authorization"] = `Bearer ${token}`;
                        const res = await fetch("/api/v1/media/upload", {
                          method: "POST",
                          headers,
                          body: formData,
                        });
                        const data = await res.json();
                        if (res.ok && data.success) setAvatar(data.data.url);
                      } catch (err) {
                        console.error("Avatar upload failed:", err);
                      } finally {
                        setIsUploadingAvatar(false);
                      }
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    avatarDrag
                      ? "border-dashed border-poppin-lilac bg-poppin-lilac-light/50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300 relative">
                    {avatar ? (
                      <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                        No Image
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700">
                      {isUploadingAvatar ? "Uploading avatar..." : "Drag and drop photo here"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 10MB</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition">
                        <span>Browse File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingAvatar(true);
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const headers: Record<string, string> = {};
                                if (token) headers["Authorization"] = `Bearer ${token}`;
                                const res = await fetch("/api/v1/media/upload", {
                                  method: "POST",
                                  headers,
                                  body: formData,
                                });
                                const data = await res.json();
                                if (res.ok && data.success) setAvatar(data.data.url);
                              } catch (err) {
                                console.error("Avatar upload failed:", err);
                              } finally {
                                setIsUploadingAvatar(false);
                              }
                            }
                          }}
                        />
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar("")}
                          className="text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Image Upload (Drag & Drop or File Select) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Profile banner cover
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setCoverDrag(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setCoverDrag(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setCoverDrag(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      setIsUploadingCover(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const headers: Record<string, string> = {};
                        if (token) headers["Authorization"] = `Bearer ${token}`;
                        const res = await fetch("/api/v1/media/upload", {
                          method: "POST",
                          headers,
                          body: formData,
                        });
                        const data = await res.json();
                        if (res.ok && data.success) setCoverImage(data.data.url);
                      } catch (err) {
                        console.error("Cover upload failed:", err);
                      } finally {
                        setIsUploadingCover(false);
                      }
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                    coverDrag
                      ? "border-dashed border-poppin-lilac bg-poppin-lilac-light/50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/60"
                  }`}
                >
                  {coverImage ? (
                    <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-300">
                      <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImage("")}
                        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-white rounded-md text-xs font-semibold"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {isUploadingCover ? "Uploading banner..." : "Drag and drop banner image here"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Recommended 1200x300, max 10MB</p>
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition">
                        <span>Browse File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingCover(true);
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const headers: Record<string, string> = {};
                                if (token) headers["Authorization"] = `Bearer ${token}`;
                                const res = await fetch("/api/v1/media/upload", {
                                  method: "POST",
                                  headers,
                                  body: formData,
                                });
                                const data = await res.json();
                                if (res.ok && data.success) setCoverImage(data.data.url);
                              } catch (err) {
                                console.error("Cover upload failed:", err);
                              } finally {
                                setIsUploadingCover(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-poppin-navy text-white text-sm font-bold hover:bg-poppin-navy-light flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-poppin-navy mb-4">Add External Link</h3>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Link Title
                </label>
                <input
                  type="text"
                  required
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="e.g. GitHub, Portfolio, Substack"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">URL</label>
                <input
                  type="text"
                  required
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-poppin-navy text-white text-sm font-bold rounded-xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-poppin-navy mb-4">Add Work Experience</h3>
            <form onSubmit={handleAddExperience} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  required
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={expLocation}
                  onChange={(e) => setExpLocation(e.target.value)}
                  placeholder="e.g. Remote / New York"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    placeholder="e.g. 2022"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    placeholder="e.g. Present"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Responsibilities & achievements..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-poppin-navy text-white text-sm font-bold rounded-xl"
                >
                  Add Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Education Modal */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-poppin-navy mb-4">Add Education</h3>
            <form onSubmit={handleAddEducation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  School / University
                </label>
                <input
                  type="text"
                  required
                  value={eduSchool}
                  onChange={(e) => setEduSchool(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Degree
                </label>
                <input
                  type="text"
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  placeholder="e.g. B.S."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={eduField}
                  onChange={(e) => setEduField(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Start Year
                  </label>
                  <input
                    type="text"
                    value={eduStart}
                    onChange={(e) => setEduStart(e.target.value)}
                    placeholder="2018"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    End Year
                  </label>
                  <input
                    type="text"
                    value={eduEnd}
                    onChange={(e) => setEduEnd(e.target.value)}
                    placeholder="2022"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEduModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-poppin-navy text-white text-sm font-bold rounded-xl"
                >
                  Add Education
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers / Following Modal */}
      {connectionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-poppin-navy capitalize">
                {connectionsModal}
              </h3>
              <button
                type="button"
                onClick={() => setConnectionsModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {connectionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-poppin-lilac" />
              </div>
            ) : connectionsList.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No {connectionsModal} yet.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-3">
                {connectionsList.map((item) => (
                  <Link
                    key={item.id}
                    href={`/profiles/${item.username}`}
                    onClick={() => setConnectionsModal(null)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-poppin-lilac-light text-poppin-lilac font-bold flex items-center justify-center text-xs overflow-hidden border border-poppin-lilac-border">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.displayName || item.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <h4 className="text-sm font-bold text-poppin-navy">
                        {item.displayName || `@${item.username}`}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">@{item.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

