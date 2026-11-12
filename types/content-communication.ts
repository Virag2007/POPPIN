// POPPIN Content & Communication Type Definitions
// Scope: Posts, Media, Engagement, Feed, Messaging & Notifications

export type PostType =
  | "UPDATE"
  | "PROJECT_SHOWCASE"
  | "ACHIEVEMENT"
  | "LOOKING_FOR";

export interface PostMediaItem {
  id: string;
  url: string;
  key?: string | null;
  mimeType?: string | null;
  size?: number | null;
  order: number;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  headline?: string | null;
}

export interface PostResponse {
  id: string;
  authorId: string;
  author: PostAuthor;
  content: string;
  type: PostType;
  links: { title: string; url: string }[];
  tags: string[];
  media: PostMediaItem[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreatePostInput {
  content: string;
  type: PostType;
  links?: { title: string; url: string }[];
  tags?: string[];
  media?: {
    url: string;
    key?: string;
    mimeType?: string;
    size?: number;
    order?: number;
  }[];
}

export interface UpdatePostInput {
  content?: string;
  type?: PostType;
  links?: { title: string; url: string }[];
  tags?: string[];
  media?: {
    url: string;
    key?: string;
    mimeType?: string;
    size?: number;
    order?: number;
  }[];
}

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface CommentResponse {
  id: string;
  postId: string;
  authorId: string;
  author: CommentAuthor;
  content: string;
  replyToCommentId?: string | null;
  replies?: CommentResponse[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateCommentInput {
  content: string;
  replyToCommentId?: string; // Only 1-level nesting allowed
}

export interface UpdateCommentInput {
  content: string;
}

export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationMemberResponse {
  id: string;
  userId: string;
  user: {
    id: string;
    username?: string;
    displayName: string | null;
    avatar: string | null;
  };
  role: "ADMIN" | "MEMBER";
  lastReadAt: Date | string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    username?: string;
    displayName: string | null;
    avatar: string | null;
  };
  content: string;
  createdAt: Date | string;
}

export interface ConversationResponse {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  members: ConversationMemberResponse[];
  lastMessage?: MessageResponse | null;
  unreadCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateGroupInput {
  name: string;
  avatar?: string;
  memberIds: string[];
}

export interface UpdateGroupInput {
  name?: string;
  avatar?: string;
}

export type NotificationType =
  | "POST_LIKE"
  | "POST_COMMENT"
  | "NEW_FOLLOWER"
  | "NEW_MESSAGE";

export interface NotificationResponse {
  id: string;
  recipientId: string;
  actorId: string;
  actor: {
    id: string;
    username?: string;
    displayName: string | null;
    avatar: string | null;
  };
  type: NotificationType;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

// Real-time Socket Event Payloads
export type RealtimeClientEvent =
  | "typing:start"
  | "typing:stop"
  | "conversation:join"
  | "conversation:leave";

export type RealtimeServerEvent =
  | "message:new"
  | "message:read"
  | "typing:start"
  | "typing:stop"
  | "notification:new";

export interface RealtimeTypingPayload {
  conversationId: string;
  userId: string;
  username?: string;
}

