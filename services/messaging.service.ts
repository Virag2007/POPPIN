import { AppError } from "@/lib/http/response";
import { MessagingRepository } from "@/repositories/messaging.repository";
import { ConnectionRepository } from "@/repositories/connection.repository";
import { NotificationService } from "@/services/notification.service";
import { realtimeBroadcaster } from "@/lib/realtime/broadcast";
import {
  ConversationResponse,
  MessageResponse,
  CreateGroupInput,
  UpdateGroupInput,
  CursorPaginatedResult,
} from "@/types";

interface ConversationDbRecord {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  members: {
    id: string;
    userId: string;
    role: string;
    lastReadAt: Date;
    user: {
      id: string;
      profile: {
        username: string;
        displayName: string | null;
        avatar: string | null;
      } | null;
    };
  }[];
  messages?: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      profile: {
        username: string;
        displayName: string | null;
        avatar: string | null;
      } | null;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingService {
  private static mapMessageToResponse(message: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      profile: {
        username: string;
        displayName: string | null;
        avatar: string | null;
      } | null;
    };
  }): MessageResponse {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.profile?.username || `user_${message.sender.id.slice(0, 8)}`,
        displayName: message.sender.profile?.displayName || null,
        avatar: message.sender.profile?.avatar || null,
      },
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  private static mapConversationToResponse(
    conv: ConversationDbRecord,
    unreadCount = 0
  ): ConversationResponse {
    const lastMsg =
      conv.messages && conv.messages.length > 0
        ? MessagingService.mapMessageToResponse(conv.messages[0])
        : null;

    return {
      id: conv.id,
      isGroup: conv.isGroup,
      name: conv.name,
      avatar: conv.avatar,
      members: conv.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        user: {
          id: m.user.id,
          username: m.user.profile?.username || `user_${m.user.id.slice(0, 8)}`,
          displayName: m.user.profile?.displayName || null,
          avatar: m.user.profile?.avatar || null,
        },
        role: m.role as "ADMIN" | "MEMBER",
        lastReadAt: m.lastReadAt,
      })),
      lastMessage: lastMsg,
      unreadCount,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  // ==========================================
  // CONVERSATIONS
  // ==========================================
  static async getConversations(userId: string): Promise<ConversationResponse[]> {
    const list = await MessagingRepository.getUserConversations(userId);
    return list.map((c) => MessagingService.mapConversationToResponse(c, c.unreadCount));
  }

  static async getOrCreateDirectConversation(
    userId: string,
    recipientId: string
  ): Promise<ConversationResponse> {
    if (userId === recipientId) {
      throw new AppError("Cannot start a conversation with yourself", 400, "CANNOT_MESSAGE_SELF");
    }

    // Verify blocking relationship
    const isBlocked = await ConnectionRepository.isBlockedOrBlocking(userId, recipientId);
    if (isBlocked) {
      throw new AppError("Cannot message a blocked user", 403, "BLOCKED_USER");
    }

    // Check existing conversation
    let conv = await MessagingRepository.findDirectConversation(userId, recipientId);
    if (!conv) {
      conv = await MessagingRepository.createDirectConversation(userId, recipientId);
    }

    const fullConv = await MessagingRepository.findConversationById(conv.id);
    if (!fullConv) throw new AppError("Conversation not found", 404, "NOT_FOUND");

    return MessagingService.mapConversationToResponse(fullConv, 0);
  }

  static async getMessages(
    conversationId: string,
    userId: string,
    limit = 30,
    cursor?: string
  ): Promise<CursorPaginatedResult<MessageResponse>> {
    const isMember = await MessagingRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AppError("You are not a member of this conversation", 403, "NOT_CONVERSATION_MEMBER");
    }

    const { messages, nextCursor, hasMore } = await MessagingRepository.getMessages(
      conversationId,
      limit,
      cursor
    );

    const items = messages.map(MessagingService.mapMessageToResponse);

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<MessageResponse> {
    const conv = await MessagingRepository.findConversationById(conversationId);
    if (!conv) {
      throw new AppError("Conversation not found", 404, "NOT_FOUND");
    }

    const isMember = conv.members.some((m) => m.userId === senderId);
    if (!isMember) {
      throw new AppError("You are not a member of this conversation", 403, "NOT_CONVERSATION_MEMBER");
    }

    // Check block contract for 1-on-1 direct conversations
    if (!conv.isGroup) {
      const otherMember = conv.members.find((m) => m.userId !== senderId);
      if (otherMember) {
        const isBlocked = await ConnectionRepository.isBlockedOrBlocking(senderId, otherMember.userId);
        if (isBlocked) {
          throw new AppError("Cannot send message to a blocked user", 403, "BLOCKED_USER");
        }
      }
    }

    const message = await MessagingRepository.createMessage(conversationId, senderId, content);
    const response = MessagingService.mapMessageToResponse(message);

    // Publish real-time event to conversation room
    realtimeBroadcaster.broadcastToRoom(conversationId, "message:new", response);

    // Trigger in-app notification for recipient members
    void NotificationService.notifyNewMessage(senderId, conversationId);

    return response;
  }

  static async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const isMember = await MessagingRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AppError("You are not a member of this conversation", 403, "NOT_CONVERSATION_MEMBER");
    }

    return MessagingRepository.getUnreadCount(conversationId, userId);
  }

  static async markConversationRead(conversationId: string, userId: string): Promise<boolean> {
    const isMember = await MessagingRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AppError("You are not a member of this conversation", 403, "NOT_CONVERSATION_MEMBER");
    }

    await MessagingRepository.markAsRead(conversationId, userId);

    // Publish real-time read event
    realtimeBroadcaster.broadcastToRoom(conversationId, "message:read", {
      conversationId,
      userId,
      readAt: new Date(),
    });

    return true;
  }

  // ==========================================
  // GROUPS & ADMIN PERMISSIONS
  // ==========================================
  static async createGroup(creatorId: string, input: CreateGroupInput): Promise<ConversationResponse> {
    const group = await MessagingRepository.createGroup(
      creatorId,
      input.name,
      input.memberIds,
      input.avatar
    );

    const fullGroup = await MessagingRepository.findConversationById(group.id);
    if (!fullGroup) throw new AppError("Group not found", 404, "NOT_FOUND");

    return MessagingService.mapConversationToResponse(fullGroup, 0);
  }

  static async getGroup(groupId: string, userId: string): Promise<ConversationResponse> {
    const group = await MessagingRepository.findConversationById(groupId);
    if (!group || !group.isGroup) {
      throw new AppError("Group not found", 404, "GROUP_NOT_FOUND");
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new AppError("You are not a member of this group", 403, "NOT_GROUP_MEMBER");
    }

    const unreadCount = await MessagingRepository.getUnreadCount(groupId, userId);
    return MessagingService.mapConversationToResponse(group, unreadCount);
  }

  static async updateGroup(
    groupId: string,
    userId: string,
    input: UpdateGroupInput
  ): Promise<ConversationResponse> {
    const role = await MessagingRepository.getMemberRole(groupId, userId);
    if (role !== "ADMIN") {
      throw new AppError("Only group admins can update group settings", 403, "ADMIN_REQUIRED");
    }

    const updated = await MessagingRepository.updateGroup(groupId, input);
    const unreadCount = await MessagingRepository.getUnreadCount(groupId, userId);
    return MessagingService.mapConversationToResponse(updated, unreadCount);
  }

  static async addGroupMember(groupId: string, adminUserId: string, targetUserId: string): Promise<boolean> {
    const role = await MessagingRepository.getMemberRole(groupId, adminUserId);
    if (role !== "ADMIN") {
      throw new AppError("Only group admins can add members", 403, "ADMIN_REQUIRED");
    }

    // Check block contract: admin cannot add a user who blocked or is blocked by admin
    const isBlocked = await ConnectionRepository.isBlockedOrBlocking(adminUserId, targetUserId);
    if (isBlocked) {
      throw new AppError("Cannot add a blocked user to the group", 403, "BLOCKED_USER");
    }

    await MessagingRepository.addGroupMember(groupId, targetUserId);
    return true;
  }

  static async removeGroupMember(groupId: string, adminUserId: string, targetUserId: string): Promise<boolean> {
    const role = await MessagingRepository.getMemberRole(groupId, adminUserId);
    if (role !== "ADMIN") {
      throw new AppError("Only group admins can remove members", 403, "ADMIN_REQUIRED");
    }

    await MessagingRepository.removeGroupMember(groupId, targetUserId);
    return true;
  }
}
