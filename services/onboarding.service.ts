import { OnboardingRepository } from "@/repositories/onboarding.repository";
import { ProfileRepository } from "@/repositories/profile.repository";
import { AppError } from "@/lib/http/response";
import { OnboardingStep1Input, OnboardingStep2Input } from "@/lib/validation/onboarding";

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class OnboardingService {
  static async getOnboardingStatus(userId: string) {
    const record = await OnboardingRepository.findByUserId(userId);

    if (!record) {
      return {
        isCompleted: false,
        step: 1,
        role: null,
        headline: null,
        skills: [],
        interests: [],
      };
    }

    return {
      id: record.id,
      userId: record.userId,
      isCompleted: record.isCompleted,
      step: record.step,
      role: record.role || null,
      headline: record.headline || null,
      skills: parseJsonArray<string>(record.skills),
      interests: parseJsonArray<string>(record.interests),
      updatedAt: record.updatedAt,
    };
  }

  static async saveStep1(userId: string, input: OnboardingStep1Input) {
    const saved = await OnboardingRepository.saveStep1(userId, input);

    // Keep profile headline in sync if profile already exists
    const profile = await ProfileRepository.findByUserId(userId);
    if (profile) {
      await ProfileRepository.update(userId, { headline: input.headline });
    }

    return {
      isCompleted: saved.isCompleted,
      step: saved.step,
      role: saved.role,
      headline: saved.headline,
      skills: parseJsonArray<string>(saved.skills),
      interests: parseJsonArray<string>(saved.interests),
    };
  }

  static async saveStep2(userId: string, input: OnboardingStep2Input) {
    const saved = await OnboardingRepository.saveStep2(userId, input);

    // Keep profile skills and interests in sync if profile already exists
    const profile = await ProfileRepository.findByUserId(userId);
    if (profile) {
      await ProfileRepository.updateSkills(userId, input.skills);
      await ProfileRepository.updateInterests(userId, input.interests);
    }

    return {
      isCompleted: saved.isCompleted,
      step: saved.step,
      role: saved.role,
      headline: saved.headline,
      skills: parseJsonArray<string>(saved.skills),
      interests: parseJsonArray<string>(saved.interests),
    };
  }

  static async getFollowSuggestions(userId: string) {
    return OnboardingRepository.getFollowSuggestions(userId, 10);
  }

  static async completeOnboarding(userId: string) {
    const record = await OnboardingRepository.findByUserId(userId);

    if (!record || !record.role || !record.headline) {
      throw new AppError("Step 1 (role and headline) must be completed before finishing onboarding", 400, "INCOMPLETE_STEP_1");
    }

    const skills = parseJsonArray<string>(record.skills);
    const interests = parseJsonArray<string>(record.interests);

    if (skills.length === 0 || interests.length === 0) {
      throw new AppError("Step 2 (skills and interests) must be completed before finishing onboarding", 400, "INCOMPLETE_STEP_2");
    }

    const completed = await OnboardingRepository.markComplete(userId);

    return {
      isCompleted: true,
      step: 3,
      role: completed.role,
      headline: completed.headline,
      skills,
      interests,
      message: "Onboarding completed successfully",
    };
  }
}
