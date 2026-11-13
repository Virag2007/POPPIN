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

    // If target account is private, create a follow request instead of confirmed follow
    if (targetUser.privacySettings?.isPrivate) {
      const existingRequest = await ConnectionRepository.findFollowRequest(currentUserId, targetUserId);
      if (existingRequest) {
        return {
          isFollowing: false,
          isRequested: true,
          status: "REQUESTED",
        };
      }

      await ConnectionRepository.createFollowRequest(currentUserId, targetUserId);
      return {
        isFollowing: false,
        isRequested: true,
        status: "REQUESTED",
      };
    }

    // Public profile -> direct follow
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
      isRequested: false,
      status: "FOLLOWING",
      followEvent,
      currentUserCounts: counts,
    };
  }

  static async cancelFollowRequest(currentUserId: string, targetUserId: string) {
    await ConnectionRepository.deleteFollowRequest(currentUserId, targetUserId);
    return {
      isFollowing: false,
      isRequested: false,
      status: "NONE",
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

    // Also cancel any pending follow request if applicable
    await ConnectionRepository.deleteFollowRequest(currentUserId, targetUserId);

    const existing = await ConnectionRepository.findFollow(currentUserId, targetUserId);
    if (!existing) {
      return {
        isFollowing: false,
        isRequested: false,
        status: "NONE",
      };
    }

    await ConnectionRepository.deleteFollow(currentUserId, targetUserId);
    const counts = await ConnectionRepository.getFollowCounts(currentUserId);

    return {
      isFollowing: false,
      isRequested: false,
      status: "NONE",
      currentUserCounts: counts,
    };
  }

  static async getFollowStatus(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      return { isFollowing: false, isRequested: false, isSelf: true, isBlocked: false };
    }

    const isBlocked = await ConnectionRepository.isBlockedOrBlocking(currentUserId, targetUserId);
    if (isBlocked) {
      return { isFollowing: false, isRequested: false, isSelf: false, isBlocked: true };
    }

    const [follow, request] = await Promise.all([
      ConnectionRepository.findFollow(currentUserId, targetUserId),
      ConnectionRepository.findFollowRequest(currentUserId, targetUserId),
    ]);

    return {
      isFollowing: !!follow,
      isRequested: !!request,
      isSelf: false,
      isBlocked: false,
    };
  }

  static async getPendingFollowRequests(userId: string) {
    const requests = await ConnectionRepository.getPendingFollowRequests(userId);
    return requests.map((req) => ({
      id: req.id,
      senderId: req.senderId,
      createdAt: req.createdAt,
      sender: {
        id: req.sender.id,
        email: req.sender.email,
        username: req.sender.profile?.username || "unknown",
        displayName: req.sender.profile?.displayName || null,
        avatar: req.sender.profile?.avatar || null,
        headline: req.sender.profile?.headline || null,
      },
    }));
  }

  static async approveFollowRequest(userId: string, senderId: string) {
    const existing = await ConnectionRepository.findFollowRequest(senderId, userId);
    if (!existing) {
      throw new AppError("Follow request not found or already processed", 404, "NOT_FOUND");
    }

    await ConnectionRepository.approveFollowRequest(userId, senderId);
    return { success: true, message: "Follow request approved" };
  }

  static async rejectFollowRequest(userId: string, senderId: string) {
    await ConnectionRepository.deleteFollowRequest(senderId, userId);
    return { success: true, message: "Follow request rejected" };
  }

  static async removeFollower(userId: string, followerId: string) {
    const existing = await ConnectionRepository.findFollow(followerId, userId);
    if (!existing) {
      throw new AppError("User is not following you", 404, "NOT_FOUND");
    }

    await ConnectionRepository.deleteFollow(followerId, userId);
    return { success: true, message: "Follower removed" };
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
