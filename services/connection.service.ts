import { ConnectionRepository } from "@/repositories/connection.repository";
import { UserRepository } from "@/repositories/user.repository";
import { AppError } from "@/lib/http/response";

export class ConnectionService {
  static async followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new AppError("You cannot follow yourself", 400, "CANNOT_FOLLOW_SELF");
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404, "USER_NOT_FOUND");
    }

    const isBlocked = await ConnectionRepository.isBlockedOrBlocking(currentUserId, targetUserId);
    if (isBlocked) {
      throw new AppError("Cannot follow this user due to block restrictions", 403, "BLOCKED_USER");
    }

    const existing = await ConnectionRepository.findFollow(currentUserId, targetUserId);
    if (existing) {
      throw new AppError("You are already following this user", 409, "ALREADY_FOLLOWING");
    }

    const follow = await ConnectionRepository.createFollow(currentUserId, targetUserId);
    const counts = await ConnectionRepository.getFollowCounts(currentUserId);

    // Documented follow event contract for notification integration
    const followEvent = {
      event: "NEW_FOLLOWER",
      followerId: currentUserId,
      targetUserId,
      timestamp: follow.createdAt.toISOString(),
    };

    return {
      isFollowing: true,
      followEvent,
      currentUserCounts: counts,
    };
  }

  static async unfollowUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new AppError("You cannot unfollow yourself", 400, "INVALID_RELATIONSHIP");
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404, "USER_NOT_FOUND");
    }

    const existing = await ConnectionRepository.findFollow(currentUserId, targetUserId);
    if (!existing) {
      throw new AppError("You are not following this user", 404, "NOT_FOLLOWING");
    }

    await ConnectionRepository.deleteFollow(currentUserId, targetUserId);
    const counts = await ConnectionRepository.getFollowCounts(currentUserId);

    return {
      isFollowing: false,
      currentUserCounts: counts,
    };
  }

  static async getFollowers(userId: string, limit = 20, offset = 0, viewerId?: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (viewerId) {
      const isBlocked = await ConnectionRepository.isBlockedOrBlocking(viewerId, userId);
      if (isBlocked) {
        throw new AppError("Access restricted", 403, "BLOCKED_USER");
      }
    }

    // Backend-enforced privacy: if private account, only owner or confirmed followers may view followers
    if (user.privacySettings?.isPrivate && viewerId !== userId) {
      const isFollowing = viewerId
        ? !!(await ConnectionRepository.findFollow(viewerId, userId))
        : false;
      if (!isFollowing) {
        throw new AppError("This account is private. Follow this user to see their followers.", 403, "PRIVATE_ACCOUNT");
      }
    }

    return ConnectionRepository.getFollowers(userId, limit, offset);
  }

  static async getFollowing(userId: string, limit = 20, offset = 0, viewerId?: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (viewerId) {
      const isBlocked = await ConnectionRepository.isBlockedOrBlocking(viewerId, userId);
      if (isBlocked) {
        throw new AppError("Access restricted", 403, "BLOCKED_USER");
      }
    }

    // Backend-enforced privacy: if private account, only owner or confirmed followers may view following
    if (user.privacySettings?.isPrivate && viewerId !== userId) {
      const isFollowing = viewerId
        ? !!(await ConnectionRepository.findFollow(viewerId, userId))
        : false;
      if (!isFollowing) {
        throw new AppError("This account is private. Follow this user to see who they follow.", 403, "PRIVATE_ACCOUNT");
      }
    }

    return ConnectionRepository.getFollowing(userId, limit, offset);
  }

  static async getSuggestedPeople(userId: string, limit = 10) {
    return ConnectionRepository.getSuggestedPeople(userId, limit);
  }
}
