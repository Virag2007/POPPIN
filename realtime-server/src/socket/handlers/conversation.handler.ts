import { Server } from "socket.io";
import { AppSocket } from "../../types/socket";
import { conversationJoinSchema } from "../../validators/message.validator";
import { ConversationService } from "../../services/conversation.service";
import { typingManager } from "../../services/presence.service";
import { Logger } from "../../lib/logger";

export function registerConversationHandlers(io: Server, socket: AppSocket) {
  const userId = socket.data.user.id;

  // Handler: conversation:join
  socket.on("conversation:join", async (data, callback) => {
    try {
      const validated = conversationJoinSchema.safeParse(data);
      if (!validated.success) {
        callback?.({
          success: false,
          error: {
            message: validated.error.errors[0]?.message || "Invalid conversation payload",
            code: "VALIDATION_ERROR",
          },
        });
        return;
      }

      const { conversationId } = validated.data;

      // Enforce conversation membership & blocking rules
      const access = await ConversationService.canAccessConversation(conversationId, userId);
      if (!access.allowed) {
        Logger.warn(`[Conversation] Access denied to user ${userId} for conversation ${conversationId}: ${access.reason}`);
        callback?.({
          success: false,
          error: {
            message: access.reason || "Unauthorized conversation access",
            code: "FORBIDDEN",
          },
        });
        return;
      }

      const roomName = `conversation:${conversationId}`;
      await socket.join(roomName);

      Logger.debug(`[Conversation] User ${userId} joined room ${roomName}`);
      callback?.({
        success: true,
        data: { conversationId, joined: true },
      });
    } catch (error) {
      Logger.error("[Conversation] conversation:join error:", error);
      callback?.({
        success: false,
        error: {
          message: "Internal server error while joining conversation",
          code: "SERVER_ERROR",
        },
      });
    }
  });

  // Handler: conversation:leave
  socket.on("conversation:leave", async (data, callback) => {
    try {
      const validated = conversationJoinSchema.safeParse(data);
      if (!validated.success) {
        callback?.({
          success: false,
          error: { message: "Invalid conversationId", code: "VALIDATION_ERROR" },
        });
        return;
      }

      const { conversationId } = validated.data;
      const roomName = `conversation:${conversationId}`;
      await socket.leave(roomName);

      // Stop any active typing indicators
      const wasTyping = typingManager.stopTyping(conversationId, userId);
      if (wasTyping) {
        io.to(roomName).emit("typing:update", {
          conversationId,
          userId,
          isTyping: false,
        });
      }

      Logger.debug(`[Conversation] User ${userId} left room ${roomName}`);
      callback?.({
        success: true,
        data: { conversationId, left: true },
      });
    } catch (error) {
      Logger.error("[Conversation] conversation:leave error:", error);
      callback?.({
        success: false,
        error: { message: "Internal server error", code: "SERVER_ERROR" },
      });
    }
  });
}

