import { prisma } from "@/lib/db";

export class NotificationRepository {
  static async createNotification(data: {
    recipientId: string;
    actorId: string;
    type: string;
    entityId?: string | null;
  }) {
    // Avoid self-notifications
    if (data.recipientId === data.actorId) {
      return null;
    }

    return prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        actorId: data.actorId,
        type: data.type,
        entityId: data.entityId || null,
        isRead: false,
      },
      include: {
        actor: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async getUserNotifications(recipientId: string, limit = 20, cursor?: string) {
    const notifications = await prisma.notification.findMany({
      where: { recipientId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        actor: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (notifications.length > limit) {
      hasMore = true;
      notifications.pop();
      nextCursor = notifications[notifications.length - 1].id;
    }

    return {
      notifications,
      nextCursor,
      hasMore,
    };
  }

  static async getUnreadCount(recipientId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientId,
        isRead: false,
      },
    });
  }

  static async findById(notificationId: string) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        actor: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async markAsRead(notificationId: string, recipientId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId,
      },
      data: {
        isRead: true,
      },
    });

    return result.count > 0;
  }

  static async markAllAsRead(recipientId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return result.count;
  }
}
