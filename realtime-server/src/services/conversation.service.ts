import { prisma } from "../lib/prisma";

export class ConversationService {
  static async isMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { id: true },
    });
    return !!member;
  }

  static async getConversationMembers(conversationId: string) {
    return prisma.conversationMember.findMany({
      where: { conversationId },
      select: {
        userId: true,
        role: true,
        lastReadAt: true,
        user: {
          select: {
            id: true,
            email: true,
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

  static async canAccessConversation(conversationId: string, userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const isMember = await this.isMember(conversationId, userId);
    if (!isMember) {
      return { allowed: false, reason: "You are not a member of this conversation" };
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!conversation) {
      return { allowed: false, reason: "Conversation not found" };
    }

    // Check block rules for 1-on-1 direct conversations
    if (!conversation.isGroup && conversation.type !== "GROUP") {
      const otherMember = conversation.members.find((m) => m.userId !== userId);
      if (otherMember) {
        const isBlocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: userId, blockedId: otherMember.userId },
              { blockerId: otherMember.userId, blockedId: userId },
            ],
          },
          select: { id: true },
        });

        if (isBlocked) {
          return { allowed: false, reason: "Cannot interact with a blocked user" };
        }
      }
    }

    return { allowed: true };
  }
}

