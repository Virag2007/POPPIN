import { AccountRepository } from "@/repositories/account.repository";
import { UserRepository } from "@/repositories/user.repository";
import { AppError } from "@/lib/http/response";
import {
  UpdateAccountInput,
  UpdatePrivacyInput,
  ReportUserInput,
} from "@/lib/validation/account";

export class AccountService {
  static async getAccount(userId: string) {
    const account = await AccountRepository.getAccountDetails(userId);
    if (!account) {
      throw new AppError("Account not found", 404, "USER_NOT_FOUND");
    }
    return account;
  }

  static async updateAccount(userId: string, input: UpdateAccountInput) {
    if (input.email) {
      const existing = await UserRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new AppError("Email is already registered by another account", 409, "EMAIL_ALREADY_EXISTS");
      }
      await AccountRepository.updateEmail(userId, input.email);
    }

    return this.getAccount(userId);
  }

  static async deleteAccount(userId: string) {
    const existing = await UserRepository.findById(userId);
    if (!existing) {
      throw new AppError("Account not found", 404, "USER_NOT_FOUND");
    }

    await AccountRepository.deleteAccount(userId);

    return {
      deleted: true,
      message: "Account deleted successfully",
    };
  }

  static async getPrivacy(userId: string) {
    const settings = await AccountRepository.getPrivacySettings(userId);
    return {
      isPrivate: settings.isPrivate,
      showActivityStatus: settings.showActivityStatus,
      allowTagging: settings.allowTagging,
      updatedAt: settings.updatedAt,
    };
  }

  static async updatePrivacy(userId: string, input: UpdatePrivacyInput) {
    const settings = await AccountRepository.updatePrivacySettings(userId, input);
    return {
      isPrivate: settings.isPrivate,
      showActivityStatus: settings.showActivityStatus,
      allowTagging: settings.allowTagging,
      updatedAt: settings.updatedAt,
    };
  }

  static async blockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new AppError("You cannot block yourself", 400, "CANNOT_BLOCK_SELF");
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404, "USER_NOT_FOUND");
    }

    const existingBlock = await AccountRepository.findBlock(currentUserId, targetUserId);
    if (existingBlock) {
      throw new AppError("User is already blocked", 409, "ALREADY_BLOCKED");
    }

    await AccountRepository.createBlock(currentUserId, targetUserId);

    return {
      blocked: true,
      blockedUserId: targetUserId,
      message: "User successfully blocked",
    };
  }

  static async unblockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new AppError("You cannot unblock yourself", 400, "INVALID_TARGET");
    }

    const existingBlock = await AccountRepository.findBlock(currentUserId, targetUserId);
    if (!existingBlock) {
      throw new AppError("User is not currently blocked", 404, "BLOCK_NOT_FOUND");
    }

    await AccountRepository.deleteBlock(currentUserId, targetUserId);

    return {
      unblocked: true,
      unblockedUserId: targetUserId,
      message: "User successfully unblocked",
    };
  }

  static async reportUser(currentUserId: string, targetUserId: string, input: ReportUserInput) {
    if (currentUserId === targetUserId) {
      throw new AppError("You cannot report yourself", 400, "CANNOT_REPORT_SELF");
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404, "USER_NOT_FOUND");
    }

    const report = await AccountRepository.createReport({
      reporterId: currentUserId,
      reportedUserId: targetUserId,
      reason: input.reason,
      details: input.details,
    });

    return {
      reported: true,
      reportId: report.id,
      reportedUserId: targetUserId,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
    };
  }
}

