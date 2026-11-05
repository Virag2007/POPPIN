import { prisma } from "@/lib/db";

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        privacySettings: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  static async findByGoogleId(googleId: string) {
    return prisma.user.findUnique({
      where: { googleId },
    });
  }

  static async create(data: {
    email: string;
    passwordHash?: string | null;
    googleId?: string | null;
  }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        googleId: data.googleId,
        privacySettings: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        tokenVersion: true,
        updatedAt: true,
      },
    });
  }

  static async revokeSessions(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });
  }

  static async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    // Invalidate existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    return prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  static async findValidPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  static async markPasswordResetTokenUsed(tokenId: string) {
    return prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { used: true },
    });
  }
}
