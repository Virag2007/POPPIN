// POPPIN Unified API Client
// Standardized client consuming platform authentication session mechanism

import {
  PostResponse,
  CreatePostInput,
  UpdatePostInput,
  CommentResponse,
  CreateCommentInput,
  UpdateCommentInput,
  CursorPaginationQuery,
  CursorPaginatedResult,
  ConversationResponse,
  MessageResponse,
  CreateGroupInput,
  UpdateGroupInput,
  NotificationResponse,
  PostMediaItem,
} from "@/types";

export interface ApiClientConfig {
  baseUrl?: string;
  getToken?: () => string | null | undefined;
}

export class PoppinApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | undefined;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || (typeof window !== "undefined" ? "" : "http://localhost:3000");
    this.getToken = config.getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data: T; message?: string }> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.getToken ? this.getToken() : null;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Enables cookie-based session auth
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const error = json?.error || {
        message: "API Request failed",
        code: "API_ERROR",
      };
      throw new Error(error.message);
    }

    return json;
  }

  // ==========================================
  // POSTS & MEDIA (Phase 1)
  // ==========================================
  async createPost(input: CreatePostInput): Promise<PostResponse> {
    const res = await this.request<PostResponse>("/api/v1/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async getPost(postId: string): Promise<PostResponse> {
    const res = await this.request<PostResponse>(`/api/v1/posts/${postId}`, {
      method: "GET",
    });
    return res.data;
  }

  async updatePost(postId: string, input: UpdatePostInput): Promise<PostResponse> {
    const res = await this.request<PostResponse>(`/api/v1/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async deletePost(postId: string): Promise<{ deleted: boolean }> {
    const res = await this.request<{ deleted: boolean }>(`/api/v1/posts/${postId}`, {
      method: "DELETE",
    });
    return res.data;
  }

  async uploadMedia(file: File | FormData): Promise<PostMediaItem> {
    const body = file instanceof FormData ? file : (() => {
      const fd = new FormData();
      fd.append("file", file);
      return fd;
    })();

    const res = await this.request<PostMediaItem>("/api/v1/media/upload", {
      method: "POST",
      body,
    });
    return res.data;
  }

  // ==========================================
  // ENGAGEMENT (Phase 2)
  // ==========================================
  async likePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await this.request<{ liked: boolean; likesCount: number }>(`/api/v1/posts/${postId}/like`, {
      method: "POST",
    });
    return res.data;
  }

  async unlikePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await this.request<{ liked: boolean; likesCount: number }>(`/api/v1/posts/${postId}/like`, {
      method: "DELETE",
    });
    return res.data;
  }

  async getComments(postId: string): Promise<CommentResponse[]> {
    const res = await this.request<CommentResponse[]>(`/api/v1/posts/${postId}/comments`, {
      method: "GET",
    });
    return res.data;
  }

  async addComment(postId: string, input: CreateCommentInput): Promise<CommentResponse> {
    const res = await this.request<CommentResponse>(`/api/v1/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async updateComment(commentId: string, input: UpdateCommentInput): Promise<CommentResponse> {
    const res = await this.request<CommentResponse>(`/api/v1/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async deleteComment(commentId: string): Promise<{ deleted: boolean }> {
    const res = await this.request<{ deleted: boolean }>(`/api/v1/comments/${commentId}`, {
      method: "DELETE",
    });
    return res.data;
  }

  async savePost(postId: string): Promise<{ saved: boolean }> {
    const res = await this.request<{ saved: boolean }>(`/api/v1/posts/${postId}/save`, {
      method: "POST",
    });
    return res.data;
  }

  async unsavePost(postId: string): Promise<{ saved: boolean }> {
    const res = await this.request<{ saved: boolean }>(`/api/v1/posts/${postId}/save`, {
      method: "DELETE",
    });
    return res.data;
  }

  async getSavedPosts(params?: CursorPaginationQuery): Promise<CursorPaginatedResult<PostResponse>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await this.request<CursorPaginatedResult<PostResponse>>(`/api/v1/users/me/saved-posts${qs}`, {
      method: "GET",
    });
    return res.data;
  }

  // ==========================================
  // FEED (Phase 3)
  // ==========================================
  async getFollowingFeed(params?: CursorPaginationQuery): Promise<CursorPaginatedResult<PostResponse>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await this.request<CursorPaginatedResult<PostResponse>>(`/api/v1/feed/following${qs}`, {
      method: "GET",
    });
    return res.data;
  }

  async getForYouFeed(params?: CursorPaginationQuery): Promise<CursorPaginatedResult<PostResponse>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await this.request<CursorPaginatedResult<PostResponse>>(`/api/v1/feed/for-you${qs}`, {
      method: "GET",
    });
    return res.data;
  }

  // ==========================================
  // MESSAGING & GROUPS (Phase 4)
  // ==========================================
  async getConversations(): Promise<ConversationResponse[]> {
    const res = await this.request<ConversationResponse[]>("/api/v1/conversations", {
      method: "GET",
    });
    return res.data;
  }

  async createConversation(recipientId: string): Promise<ConversationResponse> {
    const res = await this.request<ConversationResponse>("/api/v1/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientId }),
    });
    return res.data;
  }

  async getMessages(
    conversationId: string,
    params?: CursorPaginationQuery
  ): Promise<CursorPaginatedResult<MessageResponse>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await this.request<CursorPaginatedResult<MessageResponse>>(
      `/api/v1/conversations/${conversationId}/messages${qs}`,
      { method: "GET" }
    );
    return res.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<MessageResponse> {
    const res = await this.request<MessageResponse>(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    return res.data;
  }

  async createGroup(input: CreateGroupInput): Promise<ConversationResponse> {
    const res = await this.request<ConversationResponse>("/api/v1/groups", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async getGroup(groupId: string): Promise<ConversationResponse> {
    const res = await this.request<ConversationResponse>(`/api/v1/groups/${groupId}`, {
      method: "GET",
    });
    return res.data;
  }

  async updateGroup(groupId: string, input: UpdateGroupInput): Promise<ConversationResponse> {
    const res = await this.request<ConversationResponse>(`/api/v1/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async addGroupMember(groupId: string, userId: string): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>(`/api/v1/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    return res.data;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>(`/api/v1/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
    return res.data;
  }

  async getConversationUnreadCount(conversationId: string): Promise<{ unreadCount: number }> {
    const res = await this.request<{ unreadCount: number }>(`/api/v1/conversations/${conversationId}/unread-count`, {
      method: "GET",
    });
    return res.data;
  }

  async markConversationRead(conversationId: string): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>(`/api/v1/conversations/${conversationId}/read`, {
      method: "POST",
    });
    return res.data;
  }

  // ==========================================
  // NOTIFICATIONS (Phase 5)
  // ==========================================
  async getNotifications(params?: CursorPaginationQuery): Promise<CursorPaginatedResult<NotificationResponse>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await this.request<CursorPaginatedResult<NotificationResponse>>(`/api/v1/notifications${qs}`, {
      method: "GET",
    });
    return res.data;
  }

  async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
    const res = await this.request<{ unreadCount: number }>("/api/v1/notifications/unread-count", {
      method: "GET",
    });
    return res.data;
  }

  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>(`/api/v1/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
    return res.data;
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; markedCount: number }> {
    const res = await this.request<{ success: boolean; markedCount: number }>("/api/v1/notifications/read-all", {
      method: "PATCH",
    });
    return res.data;
  }
}

export const apiClient = new PoppinApiClient();

