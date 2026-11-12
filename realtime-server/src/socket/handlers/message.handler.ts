import { Server } from "socket.io";
import { AppSocket } from "../../types/socket";
import {
  sendMessageSchema,
  markReadSchema,
  deleteMessageSchema,
} from "../../validators/message.validator";
import { ConversationService } from "../../services/conversation.service";
import { MessageService } from "../../services/message.service";
import { typingManager } from "../../services/presence.service";
import { Logger } from "../../lib/logger";

// Simple token-bucket rate limiter per socket: 15 messages per 5 seconds
class SocketRateLimiter {
  private count = 0;
  private lastReset = Date.now();
  private readonly maxLimit = 10;
  private readonly windowMs = 10000;

  isAllowed(): boolean {
    const now = Date.now();
    if (now - this.lastReset > this.windowMs) {
      this.count = 0;
      this.lastReset = now;
    }
    if (this.count >= this.maxLimit) {
      return false;
    }
    this.count++;
    return true;
  }
}

export function registerMessageHandlers(io: Server, socket: AppSocket) {
  const userId = socket.data.user.id;
  const rateLimiter = new SocketRateLimiter();

  // Handler: message:send
  socket.on("message:send", async (data, callback) => {
    try {
      // 1. Rate Limiting
      if (!rateLimiter.isAllowed()) {
        Logger.warn(`[Message] Rate limit exceeded for socket ${socket.id} (user: ${userId})`);
        callback?.({
          success: false,
          error: {
            message: "Rate limit exceeded. Please slow down.",
            code: "RATE_LIMITED",
          },
        });
        return;
      }

      // 2. Validate Payload
      const validated = sendMessageSchema.safeParse(data);
      if (!validated.success) {
        callback?.({
          success: false,
          error: {
            message: validated.error.errors[0]?.message || "Invalid message payload",
            code: "VALIDATION_ERROR",
          },
        });
        return;
      }

      const { conversationId } = validated.data;

      // 3. Authorization Check
      const access = await ConversationService.canAccessConversation(conversationId, userId);
      if (!access.allowed) {
        callback?.({
          success: false,
          error: {
            message: access.reason || "Unauthorized to message in this conversation",
            code: "FORBIDDEN",
          },
        });
        return;
      }

      // 4. Stop typing indicator when message is sent
      const wasTyping = typingManager.stopTyping(conversationId, userId);
      if (wasTyping) {
        io.to(`conversation:${conversationId}`).emit("typing:update", {
          conversationId,
          userId,
          isTyping: false,
        });
      }

      // 5. Persist Message (with duplicate clientMessageId check)
      const { message, isDuplicate } = await MessageService.persistMessage(userId, validated.data);

      const roomName = `conversation:${conversationId}`;

      // 6. Broadcast message:new only if not a duplicate
      if (!isDuplicate) {
        io.to(roomName).emit("message:new", message);

        // Also broadcast conversation:updated to conversation room
        io.to(roomName).emit("conversation:updated", {
          conversationId,
          lastMessage: message,
        });
      }

      // 7. Acknowledge Sender
      callback?.({
        success: true,
        data: message,
      });

      Logger.debug(`[Message] Message ${message.id} (clientMsgId: ${message.clientMessageId}) sent to room ${roomName} (duplicate: ${isDuplicate})`);
    } catch (error) {
      Logger.error("[Message] message:send error:", error);
      callback?.({
        success: false,
        error: {
          message: "Internal server error persisting message",
          code: "SERVER_ERROR",
        },
      });
    }
  });

  // Handler: message:read
  socket.on("message:read", async (data, callback) => {
    try {
      const validated = markReadSchema.safeParse(data);
      if (!validated.success) {
        callback?.({
          success: false,
          error: { message: "Invalid payload for mark read", code: "VALIDATION_ERROR" },
        });
        return;
      }

      const { conversationId, messageId } = validated.data;

      const isMember = await ConversationService.isMember(conversationId, userId);
      if (!isMember) {
        callback?.({
          success: false,
          error: { message: "Not a member of this conversation", code: "FORBIDDEN" },
        });
        return;
      }

      const { readAt } = await MessageService.markAsRead(conversationId, messageId, userId);

      // Broadcast message:read to conversation room
      io.to(`conversation:${conversationId}`).emit("message:read", {
        messageId,
        conversationId,
        userId,
        readAt: readAt.toISOString(),
      });

      callback?.({ success: true, data: { readAt: readAt.toISOString() } });
    } catch (error) {
      Logger.error("[Message] message:read error:", error);
      callback?.({
        success: false,
        error: { message: "Failed to mark message as read", code: "SERVER_ERROR" },
      });
    }
  });

  // Handler: message:delete
  socket.on("message:delete", async (data, callback) => {
    try {
      const validated = deleteMessageSchema.safeParse(data);
      if (!validated.success) {
        callback?.({
          success: false,
          error: { message: "Invalid delete payload", code: "VALIDATION_ERROR" },
        });
        return;
      }

      const { conversationId, messageId } = validated.data;
      const result = await MessageService.deleteMessage(conversationId, messageId, userId);

      if (!result.success) {
        callback?.({
          success: false,
          error: { message: result.error || "Cannot delete message", code: "FORBIDDEN" },
        });
        return;
      }

      // Broadcast message:deleted to conversation room
      io.to(`conversation:${conversationId}`).emit("message:deleted", {
        messageId,
        conversationId,
      });

      callback?.({ success: true });
    } catch (error) {
      Logger.error("[Message] message:delete error:", error);
      callback?.({
        success: false,
        error: { message: "Failed to delete message", code: "SERVER_ERROR" },
      });
    }
  });
}

