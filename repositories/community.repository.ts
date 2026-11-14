import { prisma } from "@/lib/db";
import { CreateCommunityInput } from "@/lib/validation/community";

export interface CommunityFilter {
  category?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

export class CommunityRepository {
  static async create(data: CreateCommunityInput, creatorUserId: string) {
    return prisma.$transaction(async (tx) => {
      const community = await tx.community.create({
        data: {
          name: data.name,
          slug: data.slug.toLowerCase(),
          tagline: data.tagline || null,
          description: data.description || null,
          category: data.category || "General",
          avatar: data.avatar || null,
          coverImage: data.coverImage || null,
          rules: JSON.stringify(data.rules || []),
        },
      });

      await tx.communityMember.create({
        data: {
          communityId: community.id,
          userId: creatorUserId,
          role: "ADMIN",
        },
      });

      return community;
    });
  }

  static async findBySlug(slug: string) {
    return prisma.community.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        members: {
          where: { role: { in: ["ADMIN", "MODERATOR"] } },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  static async findById(id: string) {
    return prisma.community.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    });
  }

  static async list(filters: CommunityFilter = {}) {
    const { category, search, limit = 20, cursor } = filters;

    const where: Record<string, unknown> = {};

    if (category && category !== "All") {
      where.category = category;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { slug: { contains: search.trim().toLowerCase() } },
        { tagline: { contains: search.trim() } },
      ];
    }

    const items = await prisma.community.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        members: {
          where: { role: "ADMIN" },
          take: 1,
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (items.length > limit) {
      hasMore = true;
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return { items, nextCursor, hasMore };
  }

  static async isMember(communityId: string, userId: string) {
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });
    return !!member;
  }

  static async getMember(communityId: string, userId: string) {
    return prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });
  }

  static async getUserMemberships(userId: string) {
    return prisma.communityMember.findMany({
      where: { userId },
      select: { communityId: true, role: true },
    });
  }

  static async join(communityId: string, userId: string, role = "MEMBER") {
    return prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
      create: {
        communityId,
        userId,
        role,
      },
      update: {},
    });
  }

  static async leave(communityId: string, userId: string) {
    return prisma.communityMember.deleteMany({
      where: {
        communityId,
        userId,
      },
    });
  }

  static async getPosts(communityId: string, limit = 20, cursor?: string) {
    return prisma.post.findMany({
      where: { communityId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          include: { profile: true },
        },
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  }
}

