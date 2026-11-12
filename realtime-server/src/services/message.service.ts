import { prisma } from "../lib/prisma";
import { SendMessagePayload, MessageResponseDTO } from "../types/events";

export class MessageService {
  private static formatMessageDTO(msg: any): MessageResponseDTO {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      clientMessageId: msg.clientMessageId,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
      updatedAt: msg.updatedAt instanceof Date ? msg.updatedAt.toISOString() : msg.updatedAt,
      deletedAt: msg.deletedAt ? (msg.deletedAt instanceof Date ? msg.deletedAt.toISOString() : msg.deletedAt) : null,
      sender: {
        id: msg.sender.id,
        profile: msg.sender.profile
          ? {
              username: msg.sender.profile.username,
              displayName: msg.sender.profile.displayName,
              avatar: msg.sender.profile.avatar,
            }
          : null,
      },
      attachments: (msg.attachments || []).map((att: any) => ({
        id: att.id,
        secureUrl: att.secureUrl,
        resourceType: att.resourceType,
        format: att.format,
        width: att.width,
        height: att.height,
        bytes: att.bytes,
      })),
    };
  }

  static async persistMessage(
    senderId: string,
    payload: SendMessagePayload
  ): Promise<{ message: MessageResponseDTO; isDuplicate: boolean }> {
    // 1. Idempotency Check: prevent duplicate messages during retries
    const existing = await prisma.message.findUnique({
      where: {
        senderId_clientMessageId: {
          senderId,
          clientMessageId: payload.clientMessageId,
        },
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
        attachments: true,
      },
    });

    if (existing) {
      return {
        message: this.formatMessageDTO(existing),
        isDuplicate: true,
      };
    }

    // 2. Interactive transaction: create message, attachments, and update conversation
    const created = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const msg = await tx.message.create({
        data: {
          conversationId: payload.conversationId,
          senderId,
          clientMessageId: payload.clientMessageId,
          content: payload.content || "",
          type: payload.type || "TEXT",
          createdAt: now,
          updatedAt: now,
          attachments: payload.attachments && payload.attachments.length > 0
            ? {
                create: payload.attachments.map((att) => ({
                  mediaId: att.mediaId,
                  publicId: att.publicId,
                  secureUrl: att.secureUrl,
                  resourceType: att.resourceType || "image",
                  format: att.format,
                  width: att.width,
                  height: att.height,
                  bytes: att.bytes,
                })),
              }
            : undefined,
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
          attachments: true,
        },
      });

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: payload.conversationId },
        data: { updatedAt: now },
      });

      // Update sender member's lastReadAt and lastReadMessageId
      await tx.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId: payload.conversationId,
            userId: senderId,
          },
        },
        data: {
          lastReadAt: now,
          lastReadMessageId: msg.id,
        },
      });

      return msg;
    });

    return {
      message: this.formatMessageDTO(created),
      isDuplicate: false,
    };
  }

  static async markAsRead(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<{ readAt: Date }> {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Update receipt
      await tx.messageReceipt.upsert({
        where: {
          messageId_userId: { messageId, userId },
        },
        update: {
          readAt: now,
        },
        create: {
          messageId,
          userId,
          deliveredAt: now,
          readAt: now,
        },
      });

      // 2. Update member read pointer
      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: {
          lastReadAt: now,
          lastReadMessageId: messageId,
        },
      });
    });

    return { readAt: now };
  }

  static async deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, conversationId: true },
    });

    if (!message || message.conversationId !== conversationId) {
      return { success: false, error: "Message not found" };
    }

    if (message.senderId !== userId) {
      return { success: false, error: "Only the author can delete this message" };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: "This message was deleted",
      },
    });

    return { success: true };
  }

  static async getMessagesSince(conversationId: string, lastMessageId: string) {
    const pivot = await prisma.message.findUnique({
      where: { id: lastMessageId },
      select: { createdAt: true },
    });

    if (!pivot) return [];

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { gt: pivot.createdAt },
      },
      orderBy: { createdAt: "asc" },
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
        attachments: true,
      },
    });

    return messages.map(this.formatMessageDTO);
  }
}

