import { prisma } from "@/lib/db";

export class OnboardingRepository {
  static async findByUserId(userId: string) {
    return prisma.onboarding.findUnique({
      where: { userId },
    });
  }

  static async saveStep1(userId: string, data: { role: string; headline: string }) {
    return prisma.onboarding.upsert({
      where: { userId },
      create: {
        userId,
        role: data.role,
        headline: data.headline,
        step: 2,
      },
      update: {
        role: data.role,
        headline: data.headline,
        step: 2,
      },
    });
  }

  static async saveStep2(userId: string, data: { skills: string[]; interests: string[] }) {
    return prisma.onboarding.upsert({
      where: { userId },
      create: {
        userId,
        skills: JSON.stringify(data.skills),
        interests: JSON.stringify(data.interests),
        step: 3,
      },
      update: {
        skills: JSON.stringify(data.skills),
        interests: JSON.stringify(data.interests),
        step: 3,
      },
    });
  }

  static async markComplete(userId: string) {
    return prisma.onboarding.upsert({
      where: { userId },
      create: {
        userId,
        isCompleted: true,
        step: 3,
      },
      update: {
        isCompleted: true,
      },
    });
  }

  static async getFollowSuggestions(userId: string, limit = 10) {
    // 1. Get IDs of users current user is already following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // 2. Get IDs of blocked/blocker users
    const [blockedUsers, blockedByUsers] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      prisma.block.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);
    const blockedIds = [
      ...blockedUsers.map((b) => b.blockedId),
      ...blockedByUsers.map((b) => b.blockerId),
    ];

    const excludedIds = [userId, ...followingIds, ...blockedIds];

    // 3. Find available users who have completed profile setup
    const candidates = await prisma.profile.findMany({
      where: {
        userId: {
          notIn: excludedIds,
        },
      },
      take: limit,
      select: {
        userId: true,
        username: true,
        displayName: true,
        avatar: true,
        headline: true,
        bio: true,
        user: {
          select: {
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
    });

    return candidates.map((p) => ({
      userId: p.userId,
      username: p.username,
      displayName: p.displayName,
      avatar: p.avatar,
      headline: p.headline,
      bio: p.bio,
      followersCount: p.user._count.followers,
    }));
  }
}
