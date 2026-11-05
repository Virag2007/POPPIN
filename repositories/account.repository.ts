import { prisma } from "@/lib/db";
import { UpdatePrivacyInput } from "@/lib/validation/account";

export class AccountRepository {
  static async getAccountDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.profile?.username || null,
      displayName: user.profile?.displayName || null,
      hasPassword: !!user.passwordHash,
      hasGoogleAuth: !!user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async updateEmail(userId: string, email: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        updatedAt: true,
      },
    });
  }

  static async deleteAccount(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  static async getPrivacySettings(userId: string) {
    return prisma.privacySettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  static async updatePrivacySettings(userId: string, data: UpdatePrivacyInput) {
    return prisma.privacySettings.upsert({
      where: { userId },
      create: {
        userId,
        isPrivate: data.isPrivate ?? false,
        showActivityStatus: data.showActivityStatus ?? true,
        allowTagging: data.allowTagging ?? true,
      },
      update: {
        ...(data.isPrivate !== undefined ? { isPrivate: data.isPrivate } : {}),
        ...(data.showActivityStatus !== undefined ? { showActivityStatus: data.showActivityStatus } : {}),
        ...(data.allowTagging !== undefined ? { allowTagging: data.allowTagging } : {}),
      },
    });
  }

  static async findBlock(blockerId: string, blockedId: string) {
    return prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  static async createBlock(blockerId: string, blockedId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Create block
      const block = await tx.block.create({
        data: {
          blockerId,
          blockedId,
        },
      });

      // 2. Remove follow relationships in both directions
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });

      return block;
    });
  }

  static async deleteBlock(blockerId: string, blockedId: string) {
    return prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  static async createReport(data: {
    reporterId: string;
    reportedUserId: string;
    reason: string;
    details?: string;
  }) {
    return prisma.userReport.create({
      data: {
        reporterId: data.reporterId,
        reportedUserId: data.reportedUserId,
        reason: data.reason,
        details: data.details,
        status: "PENDING",
      },
    });
  }
}

