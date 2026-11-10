import { prisma } from "@/lib/db";

export class MessagingRepository {
  // ==========================================
  // DIRECT CONVERSATIONS
  // ==========================================
  static async findDirectConversation(userA: string, userB: string) {
    const directConvs = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userA } } },
          { members: { some: { userId: userB } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
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
        },
      },
    });

    return directConvs.length > 0 ? directConvs[0] : null;
  }

  static async createDirectConversation(userA: string, userB: string) {
    return prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: userA, role: "MEMBER" },
              { userId: userB, role: "MEMBER" },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
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
          },
        },
      });

      return conv;
    });
  }

  static async getUserConversations(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    const conversationIds = memberships.map((m) => m.conversationId);
    if (conversationIds.length === 0) return [];

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: "desc" },
      include: {
        members: {
          include: {
            user: {
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
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
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
        },
      },
    });

    // Compute unread counts per conversation
    const lastReadMap = new Map(memberships.map((m) => [m.conversationId, m.lastReadAt]));

    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const lastRead = lastReadMap.get(conv.id) || new Date(0);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastRead },
            senderId: { not: userId },
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return withUnread;
  }

  static async findConversationById(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
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
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
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
        },
      },
    });
  }

  static async isMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { id: true },
    });
    return !!member;
  }

  static async getMemberRole(conversationId: string, userId: string): Promise<string | null> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { role: true },
    });
    return member ? member.role : null;
  }

  // ==========================================
  // MESSAGES
  // ==========================================
  static async createMessage(conversationId: string, senderId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          createdAt: now,
        },
        include: {
          sender: {
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

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: now },
      });

      // Update sender's read marker
      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: senderId },
        },
        data: { lastReadAt: now },
      });

      return message;
    });
  }

  static async getMessages(conversationId: string, limit = 30, cursor?: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        sender: {
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

    if (messages.length > limit) {
      hasMore = true;
      messages.pop();
      nextCursor = messages[messages.length - 1].id;
    }

    return {
      messages,
      nextCursor,
      hasMore,
    };
  }

  static async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { lastReadAt: true },
    });

    if (!member) return 0;

    return prisma.message.count({
      where: {
        conversationId,
        createdAt: { gt: member.lastReadAt },
        senderId: { not: userId },
      },
    });
  }

  static async markAsRead(conversationId: string, userId: string): Promise<boolean> {
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
    return true;
  }

  // ==========================================
  // GROUPS & ADMIN
  // ==========================================
  static async createGroup(
    creatorId: string,
    name: string,
    memberIds: string[],
    avatar?: string | null
  ) {
    const uniqueMembers = Array.from(new Set(memberIds.filter((id) => id !== creatorId)));

    return prisma.$transaction(async (tx) => {
      const group = await tx.conversation.create({
        data: {
          isGroup: true,
          name,
          avatar: avatar || null,
          members: {
            create: [
              { userId: creatorId, role: "ADMIN" },
              ...uniqueMembers.map((id) => ({
                userId: id,
                role: "MEMBER",
              })),
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
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
          },
        },
      });

      return group;
    });
  }

  static async updateGroup(groupId: string, data: { name?: string; avatar?: string | null }) {
    return prisma.conversation.update({
      where: { id: groupId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
      include: {
        members: {
          include: {
            user: {
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
        },
      },
    });
  }

  static async addGroupMember(groupId: string, userId: string) {
    return prisma.conversationMember.upsert({
      where: {
        conversationId_userId: { conversationId: groupId, userId },
      },
      create: {
        conversationId: groupId,
        userId,
        role: "MEMBER",
      },
      update: {},
    });
  }

  static async removeGroupMember(groupId: string, userId: string) {
    return prisma.conversationMember.delete({
      where: {
        conversationId_userId: { conversationId: groupId, userId },
      },
    });
  }
}

