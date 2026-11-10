import { prisma } from "@/lib/db";

export class FeedRepository {
  static async getFollowingFeed(userId: string, limit = 20, cursor?: string) {
    // 1. Get following IDs from Developer 1's follow model
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);
    // Include user's own posts and followed users
    const candidateAuthorIds = Array.from(new Set([...followingIds, userId]));

    // 2. Filter out bidirectional blocks from Developer 1's block model
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const blockedIds = new Set<string>();
    for (const b of blocks) {
      if (b.blockerId === userId) blockedIds.add(b.blockedId);
      if (b.blockedId === userId) blockedIds.add(b.blockerId);
    }

    const eligibleAuthorIds = candidateAuthorIds.filter((id) => !blockedIds.has(id));

    if (eligibleAuthorIds.length === 0) {
      return {
        posts: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    // 3. Query posts in reverse-chronological order with cursor
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: eligibleAuthorIds },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        author: {
          select: {
            id: true,
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
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
        saves: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (posts.length > limit) {
      hasMore = true;
      posts.pop();
      nextCursor = posts[posts.length - 1].id;
    }

    return {
      posts,
      nextCursor,
      hasMore,
    };
  }

  static async getForYouFeed(userId?: string, limit = 20, cursor?: string) {
    // 1. Exclude bidirectional blocks if viewer is logged in
    const blockedIds = new Set<string>();
    const followedIds = new Set<string>();

    if (userId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      });

      for (const b of blocks) {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      }

      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      for (const f of follows) {
        followedIds.add(f.followingId);
      }
      followedIds.add(userId);
    }

    // 2. Exclude private profiles that viewer is not following
    const privateSettings = await prisma.privacySettings.findMany({
      where: { isPrivate: true },
      select: { userId: true },
    });

    const excludedAuthorIds = new Set<string>(blockedIds);
    for (const setting of privateSettings) {
      if (!followedIds.has(setting.userId)) {
        excludedAuthorIds.add(setting.userId);
      }
    }

    // Parse cursor (supports encoded offset cursor { offset: number } or post ID fallback)
    let offset = 0;
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
        if (typeof decoded.offset === "number") {
          offset = decoded.offset;
        }
      } catch {
        // Fallback if cursor was raw ID
        offset = 0;
      }
    }

    // 3. Fetch candidate posts
    // We fetch a candidate window for basic ranking (engagement + recency)
    const candidates = await prisma.post.findMany({
      where: {
        ...(excludedAuthorIds.size > 0
          ? { authorId: { notIn: Array.from(excludedAuthorIds) } }
          : {}),
      },
      include: {
        author: {
          select: {
            id: true,
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
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(userId
          ? {
              likes: {
                where: { userId },
                select: { id: true },
              },
              saves: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    // 4. Basic Ranking Calculation
    // Formula: (likes * 2 + comments * 3) + recencyBonus
    const now = Date.now();
    const rankedCandidates = candidates.map((post) => {
      const ageHours = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      let recencyBonus = 0;
      if (ageHours < 24) recencyBonus = 50;
      else if (ageHours < 72) recencyBonus = 25;
      else if (ageHours < 168) recencyBonus = 10;

      const engagementScore = post._count.likes * 2 + post._count.comments * 3;
      const totalScore = engagementScore + recencyBonus;

      return {
        post,
        score: totalScore,
      };
    });

    // Sort by score desc, createdAt desc, id desc
    rankedCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bTime = new Date(b.post.createdAt).getTime();
      const aTime = new Date(a.post.createdAt).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return b.post.id.localeCompare(a.post.id);
    });

    // Slice for pagination
    const pageItems = rankedCandidates.slice(offset, offset + limit + 1);
    const hasMore = pageItems.length > limit;

    if (hasMore) {
      pageItems.pop();
    }

    const posts = pageItems.map((item) => item.post);
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString("base64")
      : null;

    return {
      posts,
      nextCursor,
      hasMore,
    };
  }
}

