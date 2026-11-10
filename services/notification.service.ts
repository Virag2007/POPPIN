import { AppError } from "@/lib/http/response";
import { NotificationRepository } from "@/repositories/notification.repository";
import { PostRepository } from "@/repositories/post.repository";
import { MessagingRepository } from "@/repositories/messaging.repository";
import { realtimeBroadcaster } from "@/lib/realtime/broadcast";
import {
  NotificationResponse,
  NotificationType,
  CursorPaginatedResult,
} from "@/types";

export class NotificationService {
  private static mapNotificationToResponse(notification: {
    id: string;
    recipientId: string;
    actorId: string;
    type: string;
    entityId: string | null;
    isRead: boolean;
    createdAt: Date;
    actor: {
      id: string;
      profile: {
        username: string;
        displayName: string | null;
        avatar: string | null;
      } | null;
    };
  }): NotificationResponse {
    return {
      id: notification.id,
      recipientId: notification.recipientId,
      actorId: notification.actorId,
      actor: {
        id: notification.actor.id,
        username: notification.actor.profile?.username || `user_${notification.actor.id.slice(0, 8)}`,
        displayName: notification.actor.profile?.displayName || null,
        avatar: notification.actor.profile?.avatar || null,
      },
      type: notification.type as NotificationType,
      entityId: notification.entityId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  static async getNotifications(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<CursorPaginatedResult<NotificationResponse>> {
    const { notifications, nextCursor, hasMore } =
      await NotificationRepository.getUserNotifications(userId, limit, cursor);

    const items = notifications.map(NotificationService.mapNotificationToResponse);

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return NotificationRepository.getUnreadCount(userId);
  }

  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const success = await NotificationRepository.markAsRead(notificationId, userId);
    if (!success) {
      throw new AppError("Notification not found or access denied", 404, "NOTIFICATION_NOT_FOUND");
    }
    return true;
  }

  static async markAllAsRead(userId: string): Promise<{ success: boolean; markedCount: number }> {
    const markedCount = await NotificationRepository.markAllAsRead(userId);
    return { success: true, markedCount };
  }

  // ==========================================
  // EVENT NOTIFICATION TRIGGERS
  // ==========================================
  static async notifyPostLiked(actorId: string, postId: string) {
    try {
      const authorId = await PostRepository.findAuthorId(postId);
      if (!authorId || authorId === actorId) return;

      const notification = await NotificationRepository.createNotification({
        recipientId: authorId,
        actorId,
        type: "POST_LIKE",
        entityId: postId,
      });

      if (notification) {
        const response = NotificationService.mapNotificationToResponse(notification);
        realtimeBroadcaster.broadcastToUser(authorId, "notification:new", response);
      }
    } catch (error) {
      console.error("[Notification] notifyPostLiked failed:", error);
    }
  }

  static async notifyPostCommented(actorId: string, postId: string, commentId: string) {
    try {
      const authorId = await PostRepository.findAuthorId(postId);
      if (!authorId || authorId === actorId) return;

      const notification = await NotificationRepository.createNotification({
        recipientId: authorId,
        actorId,
        type: "POST_COMMENT",
        entityId: commentId || postId,
      });

      if (notification) {
        const response = NotificationService.mapNotificationToResponse(notification);
        realtimeBroadcaster.broadcastToUser(authorId, "notification:new", response);
      }
    } catch (error) {
      console.error("[Notification] notifyPostCommented failed:", error);
    }
  }

  static async notifyNewFollower(followerId: string, targetUserId: string) {
    try {
      if (followerId === targetUserId) return;

      const notification = await NotificationRepository.createNotification({
        recipientId: targetUserId,
        actorId: followerId,
        type: "NEW_FOLLOWER",
        entityId: followerId,
      });

      if (notification) {
        const response = NotificationService.mapNotificationToResponse(notification);
        realtimeBroadcaster.broadcastToUser(targetUserId, "notification:new", response);
      }
    } catch (error) {
      console.error("[Notification] notifyNewFollower failed:", error);
    }
  }

  static async notifyNewMessage(senderId: string, conversationId: string) {
    try {
      const conv = await MessagingRepository.findConversationById(conversationId);
      if (!conv) return;

      const otherMembers = conv.members.filter((m) => m.userId !== senderId);

      for (const member of otherMembers) {
        const notification = await NotificationRepository.createNotification({
          recipientId: member.userId,
          actorId: senderId,
          type: "NEW_MESSAGE",
          entityId: conversationId,
        });

        if (notification) {
          const response = NotificationService.mapNotificationToResponse(notification);
          realtimeBroadcaster.broadcastToUser(member.userId, "notification:new", response);
        }
      }
    } catch (error) {
      console.error("[Notification] notifyNewMessage failed:", error);
    }
  }
}
