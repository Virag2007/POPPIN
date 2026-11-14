import { prisma } from "@/lib/db";
import { CommunityRepository, CommunityFilter } from "@/repositories/community.repository";
import { CreateCommunityInput, createCommunitySchema } from "@/lib/validation/community";
import { AppError } from "@/lib/http/response";
import { Community } from "@/types";

export class CommunityService {
  static async createCommunity(data: CreateCommunityInput, currentUserId: string): Promise<Community> {
    const validated = createCommunitySchema.parse(data);

    // Check slug uniqueness
    const existing = await CommunityRepository.findBySlug(validated.slug);
    if (existing) {
      throw new AppError("A community with this slug already exists", 409, "COMMUNITY_SLUG_TAKEN");
    }

    const created = await CommunityRepository.create(validated, currentUserId);
    const full = await CommunityRepository.findBySlug(created.slug);

    if (!full) {
      throw new AppError("Failed to retrieve created community", 500, "COMMUNITY_CREATE_FAILED");
    }

    return this.formatCommunity(full, currentUserId);
  }

  static async listCommunities(filters: CommunityFilter = {}, currentUserId?: string | null) {
    const { items, nextCursor, hasMore } = await CommunityRepository.list(filters);

    let userCommunityIds = new Set<string>();
    let userRolesMap = new Map<string, string>();
    if (currentUserId) {
      const memberships = await CommunityRepository.getUserMemberships(currentUserId);
      userCommunityIds = new Set(memberships.map((m) => m.communityId));
      memberships.forEach((m) => userRolesMap.set(m.communityId, m.role));
    }

    const formatted = items.map((c) => {
      const role = currentUserId ? userRolesMap.get(c.id) || null : null;
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline || "",
        description: c.description || "",
        category: c.category as Community["category"],
        avatar: c.avatar || "",
        coverImage: c.coverImage || "",
        membersCount: c._count.members,
        isMember: currentUserId ? userCommunityIds.has(c.id) : false,
        currentUserRole: role as "ADMIN" | "MODERATOR" | "MEMBER" | null,
        isOwnerOrMod: role ? ["ADMIN", "MODERATOR", "OWNER"].includes(role) : false,
        rules: (() => {
          try {
            return JSON.parse(c.rules || "[]");
          } catch {
            return [];
          }
        })(),
        moderators: c.members.map((m) => ({
          id: m.userId,
          username: m.user.profile?.username || "creator",
          displayName: m.user.profile?.displayName || "Community Lead",
          avatar: m.user.profile?.avatar || undefined,
        })),
      };
    });

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }

  static async getCommunityBySlug(slug: string, currentUserId?: string | null): Promise<Community> {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError(`Community "${slug}" does not exist`, 404, "COMMUNITY_NOT_FOUND");
    }

    return this.formatCommunity(comm, currentUserId);
  }

  static async joinCommunity(communityId: string, currentUserId: string) {
    const comm = await CommunityRepository.findById(communityId);
    if (!comm) {
      throw new AppError("Community does not exist", 404, "COMMUNITY_NOT_FOUND");
    }

    await CommunityRepository.join(communityId, currentUserId);
    const updated = await CommunityRepository.findById(communityId);

    return {
      joined: true,
      membersCount: updated?._count.members || 1,
    };
  }

  static async leaveCommunity(communityId: string, currentUserId: string) {
    const comm = await CommunityRepository.findById(communityId);
    if (!comm) {
      throw new AppError("Community does not exist", 404, "COMMUNITY_NOT_FOUND");
    }

    await CommunityRepository.leave(communityId, currentUserId);
    const updated = await CommunityRepository.findById(communityId);

    return {
      joined: false,
      membersCount: updated?._count.members || 0,
    };
  }

  static async deleteCommunity(slug: string, currentUserId: string) {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");
    }

    // Verify requesting user is admin/owner of the community
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      throw new AppError("Only the community administrator can delete this hub", 403, "FORBIDDEN");
    }

    await prisma.community.delete({
      where: { id: comm.id },
    });

    return { success: true, message: "Community deleted successfully" };
  }

  static async getCommunityMembers(slug: string) {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId: comm.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { joinedAt: "asc" },
      ],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      displayName: m.user.profile?.displayName || m.user.profile?.username || "Member",
      username: m.user.profile?.username || `user_${m.userId.slice(0, 6)}`,
      avatar: m.user.profile?.avatar || null,
      headline: m.user.profile?.headline || null,
    }));
  }

  static async removeMember(slug: string, targetUserId: string, requestingUserId: string) {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");
    }

    const requesterMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: requestingUserId,
        },
      },
    });

    if (!requesterMember || !["ADMIN", "MODERATOR"].includes(requesterMember.role)) {
      throw new AppError("You do not have moderation permissions in this community", 403, "FORBIDDEN");
    }

    const targetMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new AppError("Member not found in community", 404, "MEMBER_NOT_FOUND");
    }

    if (targetMember.role === "ADMIN" && requesterMember.userId !== targetUserId) {
      throw new AppError("Community administrators cannot be removed by moderators", 403, "FORBIDDEN");
    }

    await prisma.communityMember.delete({
      where: { id: targetMember.id },
    });

    return { success: true, message: "Member removed from community" };
  }

  static async updateMemberRole(slug: string, targetUserId: string, newRole: "ADMIN" | "MODERATOR" | "MEMBER", requestingUserId: string) {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");
    }

    const requesterMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: requestingUserId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== "ADMIN") {
      throw new AppError("Only the community administrator can change member roles", 403, "FORBIDDEN");
    }

    const targetMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new AppError("Member not found in community", 404, "MEMBER_NOT_FOUND");
    }

    await prisma.communityMember.update({
      where: { id: targetMember.id },
      data: { role: newRole },
    });

    return { success: true, message: `Member role updated to ${newRole}` };
  }

  static async getJoinRequests(slug: string, requestingUserId: string) {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");
    }

    const requesterMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: requestingUserId,
        },
      },
    });

    if (!requesterMember || !["ADMIN", "MODERATOR"].includes(requesterMember.role)) {
      throw new AppError("You do not have permission to view join requests", 403, "FORBIDDEN");
    }

    const requests = await prisma.communityJoinRequest.findMany({
      where: { communityId: comm.id, status: "PENDING" },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      createdAt: r.createdAt,
      displayName: r.user.profile?.displayName || r.user.profile?.username || "Applicant",
      username: r.user.profile?.username || `user_${r.userId.slice(0, 6)}`,
      avatar: r.user.profile?.avatar || null,
      headline: r.user.profile?.headline || null,
    }));
  }

  static async reviewJoinRequest(slug: string, requestId: string, action: "APPROVE" | "REJECT", requestingUserId: string) {
    const comm = await CommunityRepository.findBySlug(slug);
    if (!comm) {
      throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");
    }

    const requesterMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: comm.id,
          userId: requestingUserId,
        },
      },
    });

    if (!requesterMember || !["ADMIN", "MODERATOR"].includes(requesterMember.role)) {
      throw new AppError("You do not have permission to review join requests", 403, "FORBIDDEN");
    }

    const joinRequest = await prisma.communityJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest || joinRequest.communityId !== comm.id) {
      throw new AppError("Join request not found", 404, "NOT_FOUND");
    }

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.communityJoinRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
        prisma.communityMember.upsert({
          where: {
            communityId_userId: {
              communityId: comm.id,
              userId: joinRequest.userId,
            },
          },
          create: {
            communityId: comm.id,
            userId: joinRequest.userId,
            role: "MEMBER",
          },
          update: {},
        }),
      ]);
      return { success: true, message: "Join request approved" };
    } else {
      await prisma.communityJoinRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      return { success: true, message: "Join request rejected" };
    }
  }

  // Helper formatter
  private static async formatCommunity(
    comm: NonNullable<Awaited<ReturnType<typeof CommunityRepository.findBySlug>>>,
    currentUserId?: string | null
  ): Promise<Community> {
    let currentUserRole: "ADMIN" | "MODERATOR" | "MEMBER" | null = null;
    let isMember = false;

    if (currentUserId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: comm.id,
            userId: currentUserId,
          },
        },
        select: { role: true },
      });
      if (membership) {
        isMember = true;
        currentUserRole = membership.role as "ADMIN" | "MODERATOR" | "MEMBER";
      }
    }

    const isOwnerOrMod = currentUserRole ? ["ADMIN", "MODERATOR", "OWNER"].includes(currentUserRole) : false;

    let rules: string[] = [];
    try {
      rules = JSON.parse(comm.rules || "[]");
    } catch {
      rules = [];
    }

    return {
      id: comm.id,
      slug: comm.slug,
      name: comm.name,
      tagline: comm.tagline || "",
      description: comm.description || "",
      category: comm.category as Community["category"],
      avatar: comm.avatar || "",
      coverImage: comm.coverImage || "",
      membersCount: comm._count.members,
      isMember,
      currentUserRole,
      isOwnerOrMod,
      rules,
      moderators: comm.members.map((m) => ({
        id: m.userId,
        username: m.user.profile?.username || "creator",
        displayName: m.user.profile?.displayName || "Community Lead",
        avatar: m.user.profile?.avatar || undefined,
      })),
    };
  }
}
