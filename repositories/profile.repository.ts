import { prisma } from "@/lib/db";
import { CreateProfileInput, UpdateProfileInput } from "@/lib/validation/profile";

export class ProfileRepository {
  static async findByUserId(userId: string) {
    return prisma.profile.findUnique({
      where: { userId },
    });
  }

  static async findByUsername(username: string) {
    return prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        user: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });
  }

  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const existing = await prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      select: { userId: true },
    });

    if (!existing) return true;
    if (excludeUserId && existing.userId === excludeUserId) return true;
    return false;
  }

  static async create(userId: string, data: CreateProfileInput) {
    return prisma.profile.create({
      data: {
        userId,
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        avatar: data.avatar,
        coverImage: data.coverImage,
        headline: data.headline,
        bio: data.bio,
        location: data.location,
      },
    });
  }

  static async update(userId: string, data: UpdateProfileInput) {
    return prisma.profile.update({
      where: { userId },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
        ...(data.headline !== undefined ? { headline: data.headline } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
      },
    });
  }

  static async updateSkills(userId: string, skills: string[]) {
    return prisma.profile.update({
      where: { userId },
      data: { skills: JSON.stringify(skills) },
    });
  }

  static async updateInterests(userId: string, interests: string[]) {
    return prisma.profile.update({
      where: { userId },
      data: { interests: JSON.stringify(interests) },
    });
  }

  static async updateLinks(userId: string, links: any[]) {
    return prisma.profile.update({
      where: { userId },
      data: { links: JSON.stringify(links) },
    });
  }

  static async updateEducation(userId: string, education: any[]) {
    return prisma.profile.update({
      where: { userId },
      data: { education: JSON.stringify(education) },
    });
  }

  static async updateExperience(userId: string, experience: any[]) {
    return prisma.profile.update({
      where: { userId },
      data: { experience: JSON.stringify(experience) },
    });
  }

  static async getFollowerAndFollowingCounts(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return { followersCount, followingCount };
  }
}

