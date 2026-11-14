import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http/response";
import { checkOwnership } from "@/lib/auth/middleware";
import { EngagementRepository } from "@/repositories/engagement.repository";
import { PostRepository } from "@/repositories/post.repository";
import { ConnectionRepository } from "@/repositories/connection.repository";
import { AccountRepository } from "@/repositories/account.repository";
import { NotificationService } from "@/services/notification.service";
import {
  CommentResponse,
  CreateCommentInput,
  PostResponse,
  PostType,
  PostMediaItem,
  CursorPaginatedResult,
} from "@/types";

export class EngagementService {
  private static parseJsonSafely<T>(value: unknown, fallback: T): T {
    if (typeof value !== "string") return (value as T) ?? fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private static async checkPostAccess(postId: string, currentUserId?: string) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    const authorId = post.authorId;

    if (currentUserId && currentUserId !== authorId) {
      const isBlocked = await ConnectionRepository.isBlockedOrBlocking(currentUserId, authorId);
      if (isBlocked) {
        throw new AppError("Content is unavailable", 403, "BLOCKED_USER");
      }
    }

    if (currentUserId !== authorId) {
      const privacy = await AccountRepository.getPrivacySettings(authorId);
      if (privacy && privacy.isPrivate) {
        if (!currentUserId) {
          throw new AppError("This post is from a private profile", 403, "PRIVATE_PROFILE");
        }
        const follow = await ConnectionRepository.findFollow(currentUserId, authorId);
        if (!follow) {
          throw new AppError("This post is from a private profile", 403, "PRIVATE_PROFILE");
        }
      }
    }

    return post;
  }

  // ==========================================
  // LIKES
  // ==========================================
  static async likePost(userId: string, postId: string) {
    await this.checkPostAccess(postId, userId);
    const result = await EngagementRepository.likePost(userId, postId);
    void NotificationService.notifyPostLiked(userId, postId);
    return result;
  }

  static async unlikePost(userId: string, postId: string) {
    // Check post exists
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }
    return EngagementRepository.unlikePost(userId, postId);
  }

  // ==========================================
  // COMMENTS
  // ==========================================
  static async getComments(postId: string, currentUserId?: string): Promise<CommentResponse[]> {
    await this.checkPostAccess(postId, currentUserId);
    const comments = await EngagementRepository.getCommentsByPostId(postId);

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      author: {
        id: c.author.id,
        username: c.author.profile?.username || `user_${c.author.id.slice(0, 8)}`,
        displayName: c.author.profile?.displayName || null,
        avatar: c.author.profile?.avatar || null,
      },
      content: c.content,
      replyToCommentId: c.replyToCommentId,
      replies: (c.replies || []).map((r) => ({
        id: r.id,
        postId: r.postId,
        authorId: r.authorId,
        author: {
          id: r.author.id,
          username: r.author.profile?.username || `user_${r.author.id.slice(0, 8)}`,
          displayName: r.author.profile?.displayName || null,
          avatar: r.author.profile?.avatar || null,
        },
        content: r.content,
        replyToCommentId: r.replyToCommentId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  static async createComment(
    postId: string,
    userId: string,
    input: CreateCommentInput
  ): Promise<CommentResponse> {
    await this.checkPostAccess(postId, userId);
    const comment = await EngagementRepository.createComment(
      postId,
      userId,
      input.content,
      input.replyToCommentId
    );

    void NotificationService.notifyPostCommented(userId, postId, comment.id);

    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      author: {
        id: comment.author.id,
        username: comment.author.profile?.username || `user_${comment.author.id.slice(0, 8)}`,
        displayName: comment.author.profile?.displayName || null,
        avatar: comment.author.profile?.avatar || null,
      },
      content: comment.content,
      replyToCommentId: comment.replyToCommentId,
      replies: [],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  static async updateComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<CommentResponse> {
    const comment = await EngagementRepository.findCommentById(commentId);
    if (!comment) {
      throw new AppError("Comment not found", 404, "NOT_FOUND");
    }

    checkOwnership(comment.authorId, userId, "You do not have permission to edit this comment");

    const updated = await EngagementRepository.updateComment(commentId, content);
    return {
      id: updated.id,
      postId: updated.postId,
      authorId: updated.authorId,
      author: {
        id: updated.author.id,
        username: updated.author.profile?.username || `user_${updated.author.id.slice(0, 8)}`,
        displayName: updated.author.profile?.displayName || null,
        avatar: updated.author.profile?.avatar || null,
      },
      content: updated.content,
      replyToCommentId: updated.replyToCommentId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  static async deleteComment(commentId: string, userId: string): Promise<{ success: true; message: string }> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: { authorId: true, communityId: true },
        },
      },
    });
    if (!comment) {
      throw new AppError("Comment not found", 404, "NOT_FOUND");
    }

    let isAuthorized = comment.authorId === userId || comment.post.authorId === userId;
    if (!isAuthorized && comment.post.communityId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: comment.post.communityId,
            userId,
          },
        },
      });
      if (membership && ["ADMIN", "MODERATOR", "OWNER"].includes(membership.role)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new AppError("You do not have permission to delete this comment", 403, "FORBIDDEN");
    }

    await EngagementRepository.deleteComment(commentId);
    return { success: true, message: "Comment deleted successfully" };
  }

  // ==========================================
  // SAVED POSTS
  // ==========================================
  static async savePost(userId: string, postId: string) {
    await this.checkPostAccess(postId, userId);
    return EngagementRepository.savePost(userId, postId);
  }

  static async unsavePost(userId: string, postId: string) {
    return EngagementRepository.unsavePost(userId, postId);
  }

  static async getSavedPosts(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<CursorPaginatedResult<PostResponse>> {
    const { records, nextCursor, hasMore } = await EngagementRepository.getSavedPosts(
      userId,
      limit,
      cursor
    );

    const items: PostResponse[] = records.map(({ post }) => {
      const rawLinks = EngagementService.parseJsonSafely<{ title: string; url: string }[]>(
        post.links,
        []
      );
      const rawTags = EngagementService.parseJsonSafely<string[]>(post.tags, []);

      const mediaItems: PostMediaItem[] = (post.media || []).map((m) => ({
        id: m.id,
        url: m.url,
        key: m.key,
        mimeType: m.mimeType,
        size: m.size,
        order: m.order,
      }));

      const authorProfile = post.author.profile;
      const authorUsername = authorProfile?.username || `user_${post.author.id.slice(0, 8)}`;

      return {
        id: post.id,
        authorId: post.authorId,
        author: {
          id: post.author.id,
          username: authorUsername,
          displayName: authorProfile?.displayName || null,
          avatar: authorProfile?.avatar || null,
          headline: authorProfile?.headline || null,
        },
        content: post.content,
        type: post.type as PostType,
        links: rawLinks,
        tags: rawTags,
        media: mediaItems,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked: post.likes ? post.likes.length > 0 : false,
        isSaved: true,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}

