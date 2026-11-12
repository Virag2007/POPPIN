import { prisma } from "@/lib/db";

export class SearchRepository {
  static async searchUsers(query: string, limit = 5) {
    return prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
          { headline: { contains: query } },
        ],
      },
      take: limit,
      select: {
        userId: true,
        username: true,
        displayName: true,
        avatar: true,
        headline: true,
      },
    });
  }

  static async searchCommunities(query: string, limit = 5) {
    return prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { slug: { contains: query } },
          { tagline: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        avatar: true,
        category: true,
        _count: {
          select: { members: true },
        },
      },
    });
  }

  static async searchPosts(query: string, limit = 10) {
    return prisma.post.findMany({
      where: {
        OR: [
          { content: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          include: { profile: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  }

  static async getTrendingTags(limit = 6) {
    // Collect all posts tags to aggregate counts
    const posts = await prisma.post.findMany({
      select: { tags: true },
      take: 200,
    });

    const tagCounts: Record<string, number> = {};
    for (const p of posts) {
      try {
        const parsed = JSON.parse(p.tags || "[]");
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            if (t && typeof t === "string") {
              const clean = t.trim();
              if (clean) {
                tagCounts[clean] = (tagCounts[clean] || 0) + 1;
              }
            }
          }
        }
      } catch {
        // ignore malformed
      }
    }

    const sorted = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  }
}

