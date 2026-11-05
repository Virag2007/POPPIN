import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http/response";

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

  /**
   * Atomically consumes a password reset token and updates the user's password in a single transaction.
   * Uses an atomic conditional update (updateMany WHERE id = token.id AND used = false AND expiresAt > now)
   * requiring count === 1 to guarantee that even under PostgreSQL READ COMMITTED isolation, two simultaneous
   * requests cannot both consume the same token. If password update or token update fails, the entire transaction rolls back.
   */
  static async consumeResetTokenAndUpdatePassword(tokenHash: string, newPasswordHash: string) {
    return prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.passwordResetToken.findFirst({
        where: {
          token: tokenHash,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!tokenRecord) {
        throw new AppError("Invalid or expired password reset token", 400, "INVALID_RESET_TOKEN");
      }

      // Atomic conditional update: strictly requires exactly 1 record updated
      const consumeResult = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenRecord.id,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: {
          used: true,
        },
      });

      if (consumeResult.count !== 1) {
        throw new AppError("Invalid or expired password reset token", 400, "INVALID_RESET_TOKEN");
      }

      // Atomically update user's password and increment tokenVersion (revoking prior sessions)
      return tx.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          email: true,
          tokenVersion: true,
        },
      });
    });
  }

  static async consumePasswordResetToken(tokenHash: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.passwordResetToken.findFirst({
        where: {
          token: tokenHash,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record) {
        return null;
      }

      const updated = await tx.passwordResetToken.updateMany({
        where: { id: record.id, used: false, expiresAt: { gt: new Date() } },
        data: { used: true },
      });

      return updated.count === 1 ? record : null;
    });
  }

  static async markPasswordResetTokenUsed(tokenId: string) {
    return prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { used: true },
    });
  }
}
