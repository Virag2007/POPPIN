import crypto from "crypto";
import { ProfileRepository } from "@/repositories/profile.repository";
import { AppError } from "@/lib/http/response";
import {
  CreateProfileInput,
  UpdateProfileInput,
  usernameRegex,
} from "@/lib/validation/profile";
import { SafeProfile } from "@/types";

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatProfileResponse(profile: any, counts: { followersCount: number; followingCount: number }): SafeProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName || null,
    avatar: profile.avatar || null,
    coverImage: profile.coverImage || null,
    headline: profile.headline || null,
    bio: profile.bio || null,
    location: profile.location || null,
    skills: parseJsonArray<string>(profile.skills),
    interests: parseJsonArray<string>(profile.interests),
    links: parseJsonArray<any>(profile.links),
    education: parseJsonArray<any>(profile.education),
    experience: parseJsonArray<any>(profile.experience),
    followersCount: counts.followersCount,
    followingCount: counts.followingCount,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export class ProfileService {
  static async checkUsernameAvailability(rawUsername: string, excludeUserId?: string) {
    const username = (rawUsername || "").trim().toLowerCase();
    if (!usernameRegex.test(username)) {
      return {
        username,
        isAvailable: false,
        reason: "Username must be 3-30 characters and alphanumeric/underscores only",
      };
    }

    const isAvailable = await ProfileRepository.isUsernameAvailable(username, excludeUserId);
    return {
      username,
      isAvailable,
      reason: isAvailable ? "Username is available" : "Username is already taken",
    };
  }

  static async createProfile(userId: string, input: CreateProfileInput) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (existing) {
      throw new AppError("Profile already exists for this user", 409, "PROFILE_ALREADY_EXISTS");
    }

    const isAvailable = await ProfileRepository.isUsernameAvailable(input.username);
    if (!isAvailable) {
      throw new AppError("Username is already taken", 409, "USERNAME_TAKEN");
    }

    const created = await ProfileRepository.create(userId, input);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(created, counts);
  }

  static async getOwnProfile(userId: string) {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new AppError("Profile not found. Please create your profile first.", 404, "PROFILE_NOT_FOUND");
    }

    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(profile, counts);
  }

  static async updateOwnProfile(userId: string, input: UpdateProfileInput) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const updated = await ProfileRepository.update(userId, input);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(updated, counts);
  }

  static async getPublicProfileByUsername(username: string) {
    const profile = await ProfileRepository.findByUsername(username);
    if (!profile) {
      throw new AppError(`User profile @${username} not found`, 404, "PROFILE_NOT_FOUND");
    }

    const counts = await ProfileRepository.getFollowerAndFollowingCounts(profile.userId);
    return formatProfileResponse(profile, counts);
  }

  static async updateSkills(userId: string, skills: string[]) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const updated = await ProfileRepository.updateSkills(userId, skills);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(updated, counts);
  }

  static async updateInterests(userId: string, interests: string[]) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const updated = await ProfileRepository.updateInterests(userId, interests);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(updated, counts);
  }

  static async updateLinks(userId: string, links: any[]) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const updated = await ProfileRepository.updateLinks(userId, links);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(updated, counts);
  }

  static async updateEducation(userId: string, education: any[]) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const items = education.map((item) => ({
      id: item.id || crypto.randomUUID(),
      school: item.school,
      degree: item.degree || null,
      fieldOfStudy: item.fieldOfStudy || null,
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      description: item.description || null,
    }));

    const updated = await ProfileRepository.updateEducation(userId, items);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(updated, counts);
  }

  static async updateExperience(userId: string, experience: any[]) {
    const existing = await ProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const items = experience.map((item) => ({
      id: item.id || crypto.randomUUID(),
      company: item.company,
      title: item.title,
      location: item.location || null,
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      current: item.current || false,
      description: item.description || null,
    }));

    const updated = await ProfileRepository.updateExperience(userId, items);
    const counts = await ProfileRepository.getFollowerAndFollowingCounts(userId);
    return formatProfileResponse(updated, counts);
  }
}

