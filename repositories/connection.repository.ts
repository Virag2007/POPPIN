import { prisma } from "@/lib/db";

export class ConnectionRepository {
  static async findFollow(followerId: string, followingId: string) {
    return prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  static async isBlockedOrBlocking(userA: string, userB: string): Promise<boolean> {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return !!block;
  }

  static async createFollow(followerId: string, followingId: string) {
    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  static async deleteFollow(followerId: string, followingId: string) {
    return prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  static async getFollowers(userId: string, limit = 20, offset = 0) {
    const [total, followers] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.findMany({
        where: { followingId: userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatar: true,
                  headline: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      limit,
      offset,
      items: followers.map((f) => ({
        userId: f.follower.id,
        email: f.follower.email,
        username: f.follower.profile?.username || null,
        displayName: f.follower.profile?.displayName || null,
        avatar: f.follower.profile?.avatar || null,
        headline: f.follower.profile?.headline || null,
        followedAt: f.createdAt,
      })),
    };
  }

  static async getFollowing(userId: string, limit = 20, offset = 0) {
    const [total, following] = await Promise.all([
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.findMany({
        where: { followerId: userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          following: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatar: true,
                  headline: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      limit,
      offset,
      items: following.map((f) => ({
        userId: f.following.id,
        email: f.following.email,
        username: f.following.profile?.username || null,
        displayName: f.following.profile?.displayName || null,
        avatar: f.following.profile?.avatar || null,
        headline: f.following.profile?.headline || null,
        followedAt: f.createdAt,
      })),
    };
  }

  static async getFollowCounts(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return { followersCount, followingCount };
  }

  static async getSuggestedPeople(userId: string, limit = 10) {
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
