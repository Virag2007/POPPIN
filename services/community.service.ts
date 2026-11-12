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
    if (currentUserId) {
      const memberships = await CommunityRepository.getUserMemberships(currentUserId);
      userCommunityIds = new Set(memberships.map((m) => m.communityId));
    }

    const formatted = items.map((c) => ({
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
    }));

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

  // Helper formatter
  private static formatCommunity(
    comm: NonNullable<Awaited<ReturnType<typeof CommunityRepository.findBySlug>>>,
    currentUserId?: string | null
  ): Community {
    const isMember = currentUserId
      ? comm.members.some((m) => m.userId === currentUserId)
      : false;

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
