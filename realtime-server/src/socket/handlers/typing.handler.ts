import { Server } from "socket.io";
import { AppSocket } from "../../types/socket";
import { typingSchema } from "../../validators/message.validator";
import { ConversationService } from "../../services/conversation.service";
import { typingManager } from "../../services/presence.service";
import { Logger } from "../../lib/logger";

export function registerTypingHandlers(io: Server, socket: AppSocket) {
  const userId = socket.data.user.id;

  // Handler: typing:start
  socket.on("typing:start", async (data) => {
    try {
      const validated = typingSchema.safeParse(data);
      if (!validated.success) return;

      const { conversationId } = validated.data;
      const isMember = await ConversationService.isMember(conversationId, userId);
      if (!isMember) return;

      const roomName = `conversation:${conversationId}`;

      const isNew = typingManager.startTyping(
        conversationId,
        userId,
        () => {
          // When auto-expiration timer fires after 4 seconds of inactivity
          io.to(roomName).emit("typing:update", {
            conversationId,
            userId,
            isTyping: false,
          });
        },
        4000
      );

      // Only broadcast if user wasn't already marked as typing to avoid spamming
      if (isNew) {
        socket.to(roomName).emit("typing:update", {
          conversationId,
          userId,
          isTyping: true,
        });
      }
    } catch (error) {
      Logger.error("[Typing] typing:start error:", error);
    }
  });

  // Handler: typing:stop
  socket.on("typing:stop", async (data) => {
    try {
      const validated = typingSchema.safeParse(data);
      if (!validated.success) return;

      const { conversationId } = validated.data;
      const roomName = `conversation:${conversationId}`;

      const wasTyping = typingManager.stopTyping(conversationId, userId);
      if (wasTyping) {
        socket.to(roomName).emit("typing:update", {
          conversationId,
          userId,
          isTyping: false,
        });
      }
    } catch (error) {
      Logger.error("[Typing] typing:stop error:", error);
    }
  });
}

