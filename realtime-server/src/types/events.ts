export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";

export interface AttachmentPayload {
  mediaId?: string;
  publicId?: string;
  secureUrl: string;
  resourceType?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface SendMessagePayload {
  conversationId: string;
  clientMessageId: string;
  content: string;
  type?: MessageType;
  attachments?: AttachmentPayload[];
}

export interface MarkReadPayload {
  conversationId: string;
  messageId: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface DeleteMessagePayload {
  conversationId: string;
  messageId: string;
}

export interface MessageResponseDTO {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId?: string | null;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  sender: {
    id: string;
    profile?: {
      username: string;
      displayName?: string | null;
      avatar?: string | null;
    } | null;
  };
  attachments: {
    id: string;
    secureUrl: string;
    resourceType: string;
    format?: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
  }[];
}

export interface AckResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Client to Server Events Interface
export interface ClientToServerEvents {
  "conversation:join": (data: { conversationId: string }, callback?: (res: AckResponse) => void) => void;
  "conversation:leave": (data: { conversationId: string }, callback?: (res: AckResponse) => void) => void;
  "message:send": (data: SendMessagePayload, callback?: (res: AckResponse<MessageResponseDTO>) => void) => void;
  "message:read": (data: MarkReadPayload, callback?: (res: AckResponse) => void) => void;
  "message:delete": (data: DeleteMessagePayload, callback?: (res: AckResponse) => void) => void;
  "typing:start": (data: TypingPayload) => void;
  "typing:stop": (data: TypingPayload) => void;
  "heartbeat": (callback?: (res: { timestamp: number }) => void) => void;
}

// Server to Client Events Interface
export interface ServerToClientEvents {
  "message:new": (message: MessageResponseDTO) => void;
  "message:delivered": (data: { messageId: string; conversationId: string; userId: string; deliveredAt: string }) => void;
  "message:read": (data: { messageId: string; conversationId: string; userId: string; readAt: string }) => void;
  "message:deleted": (data: { messageId: string; conversationId: string }) => void;
  "typing:update": (data: { conversationId: string; userId: string; isTyping: boolean; username?: string }) => void;
  "user:online": (data: { userId: string; timestamp: string }) => void;
  "user:offline": (data: { userId: string; lastSeen: string }) => void;
  "conversation:updated": (data: { conversationId: string; lastMessage?: MessageResponseDTO }) => void;
  "error": (err: { message: string; code?: string }) => void;
}

