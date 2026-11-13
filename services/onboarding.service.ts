import { OnboardingRepository } from "@/repositories/onboarding.repository";
import { ProfileRepository } from "@/repositories/profile.repository";
import { AppError } from "@/lib/http/response";
import { OnboardingStep1Input, OnboardingStep2Input, OnboardingImagesInput } from "@/lib/validation/onboarding";

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
    const profile = await ProfileRepository.findByUserId(userId);

    if (!record) {
      return {
        isCompleted: false,
        step: 1,
        role: null,
        headline: profile?.headline || null,
        displayName: profile?.displayName || null,
        username: profile?.username || null,
        bio: profile?.bio || null,
        avatar: profile?.avatar || null,
        coverImage: profile?.coverImage || null,
        skills: parseJsonArray<string>(profile?.skills),
        interests: parseJsonArray<string>(profile?.interests),
      };
    }

    return {
      id: record.id,
      userId: record.userId,
      isCompleted: record.isCompleted,
      step: record.step,
      role: record.role || null,
      headline: record.headline || profile?.headline || null,
      displayName: profile?.displayName || null,
      username: profile?.username || null,
      bio: profile?.bio || null,
      avatar: profile?.avatar || null,
      coverImage: profile?.coverImage || null,
      skills: parseJsonArray<string>(record.skills || profile?.skills),
      interests: parseJsonArray<string>(record.interests || profile?.interests),
      updatedAt: record.updatedAt,
    };
  }

  static async saveStep1(userId: string, input: OnboardingStep1Input) {
    const role = input.role || input.headline;
    const saved = await OnboardingRepository.saveStep1(userId, { role, headline: input.headline });

    // Keep profile fields in sync
    const profile = await ProfileRepository.findByUserId(userId);
    if (profile) {
      await ProfileRepository.update(userId, {
        ...(input.displayName ? { displayName: input.displayName } : {}),
        headline: input.headline,
        ...(input.bio ? { bio: input.bio } : {}),
      });
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

  static async saveImages(userId: string, input: OnboardingImagesInput) {
    const profile = await ProfileRepository.findByUserId(userId);
    if (profile) {
      await ProfileRepository.update(userId, {
        avatar: input.avatar,
        coverImage: input.coverImage,
      });
    }
    return { success: true };
  }

  static async saveStep2(userId: string, input: OnboardingStep2Input) {
    const saved = await OnboardingRepository.saveStep2(userId, input);

    // Keep profile skills and interests in sync if profile already exists
    const profile = await ProfileRepository.findByUserId(userId);
    if (profile) {
      await ProfileRepository.updateSkills(userId, input.skills || []);
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
    const onboarding = await OnboardingRepository.findByUserId(userId);
    if (!onboarding || onboarding.step < 3) {
      throw new AppError(
        "Cannot complete onboarding before completing prior steps",
        400,
        "ONBOARDING_INCOMPLETE"
      );
    }

    const completed = await OnboardingRepository.markComplete(userId);

    return {
      isCompleted: true,
      step: completed.step,
      message: "Onboarding completed successfully",
    };
  }
}
