import { AppError } from "@/lib/http/response";
import { checkOwnership } from "@/lib/auth/middleware";
import { PostRepository } from "@/repositories/post.repository";
import { ConnectionRepository } from "@/repositories/connection.repository";
import { AccountRepository } from "@/repositories/account.repository";
import { getStorageProvider } from "@/lib/storage";
import {
  CreatePostInput,
  UpdatePostInput,
  PostResponse,
  PostType,
  PostMediaItem,
} from "@/types";

export interface PostDbRecord {
  id: string;
  authorId: string;
  author: {
    id: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
      headline: string | null;
    } | null;
  };
  content: string;
  type: string;
  links: string;
  tags: string;
  media?: {
    id: string;
    url: string;
    key?: string | null;
    mimeType?: string | null;
    size?: number | null;
    order: number;
  }[];
  _count: {
    likes: number;
    comments: number;
  };
  likes?: { id: string }[];
  saves?: { id: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export class PostService {
  private static parseJsonSafely<T>(value: unknown, fallback: T): T {
    if (typeof value !== "string") return (value as T) ?? fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private static normalizeTags(tags?: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    const cleaned = tags
      .map((t) => t.trim().replace(/^#+/, "").toLowerCase())
      .filter((t) => t.length > 0 && /^[a-zA-Z0-9_]+$/.test(t));
    return Array.from(new Set(cleaned));
  }

  public static mapPostToResponse(
    post: PostDbRecord,
    currentUserId?: string
  ): PostResponse {
    const rawLinks = PostService.parseJsonSafely<{ title: string; url: string }[]>(post.links, []);
    const rawTags = PostService.parseJsonSafely<string[]>(post.tags, []);

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

    const isLiked = currentUserId && "likes" in post && Array.isArray(post.likes)
      ? post.likes.length > 0
      : undefined;

    const isSaved = currentUserId && "saves" in post && Array.isArray(post.saves)
      ? post.saves.length > 0
      : undefined;

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
      ...(isLiked !== undefined ? { isLiked } : {}),
      ...(isSaved !== undefined ? { isSaved } : {}),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  static async createPost(userId: string, input: CreatePostInput): Promise<PostResponse> {
    const normalizedTags = PostService.normalizeTags(input.tags);
    const post = await PostRepository.create(userId, {
      ...input,
      tags: normalizedTags,
    });

    if (!post) {
      throw new AppError("Failed to create post", 500, "INTERNAL_SERVER_ERROR");
    }

    return PostService.mapPostToResponse(post, userId);
  }

  static async getPost(postId: string, currentUserId?: string): Promise<PostResponse> {
    const post = await PostRepository.findById(postId, currentUserId);
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    const authorId = post.authorId;

    // Check bidirectional blocking if viewer is logged in
    if (currentUserId && currentUserId !== authorId) {
      const isBlocked = await ConnectionRepository.isBlockedOrBlocking(currentUserId, authorId);
      if (isBlocked) {
        throw new AppError("Content is unavailable", 403, "BLOCKED_USER");
      }
    }

    // Check privacy settings if viewer is not the author
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

    return PostService.mapPostToResponse(post, currentUserId);
  }

  static async updatePost(postId: string, userId: string, input: UpdatePostInput): Promise<PostResponse> {
    const authorId = await PostRepository.findAuthorId(postId);
    if (!authorId) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    checkOwnership(authorId, userId, "You do not have permission to edit this post");

    const updatePayload: UpdatePostInput = { ...input };
    if (input.tags !== undefined) {
      updatePayload.tags = PostService.normalizeTags(input.tags);
    }

    const updated = await PostRepository.update(postId, updatePayload);
    if (!updated) {
      throw new AppError("Failed to update post", 500, "INTERNAL_SERVER_ERROR");
    }

    return PostService.mapPostToResponse(updated, userId);
  }

  static async deletePost(postId: string, userId: string): Promise<{ success: true; message: string }> {
    const authorId = await PostRepository.findAuthorId(postId);
    if (!authorId) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    checkOwnership(authorId, userId, "You do not have permission to delete this post");

    // Retrieve storage keys to clean up images and avoid orphaning media
    const mediaKeys = await PostRepository.findMediaKeysByPostId(postId);
    if (mediaKeys.length > 0) {
      const storage = getStorageProvider();
      await Promise.allSettled(mediaKeys.map((key) => storage.delete(key)));
    }

    await PostRepository.delete(postId);
    return { success: true, message: "Post deleted successfully" };
  }

  static async uploadMedia(fileBuffer: Buffer, fileName: string, mimeType: string) {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const normalizedMime = mimeType.toLowerCase();

    if (!allowedMimeTypes.includes(normalizedMime)) {
      throw new AppError(
        "Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    // 10 MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      throw new AppError(
        "File size exceeds 10MB limit",
        400,
        "FILE_TOO_LARGE"
      );
    }

    const storage = getStorageProvider();
    return storage.upload(fileBuffer, fileName, normalizedMime);
  }

  static async getPostsByAuthor(
    authorId: string,
    viewerId: string,
    limit = 20,
    cursor?: string
  ) {
    // Check bidirectional blocking if viewer is not author
    if (viewerId !== authorId) {
      const isBlocked = await ConnectionRepository.isBlockedOrBlocking(viewerId, authorId);
      if (isBlocked) {
        throw new AppError("Account unavailable", 403, "BLOCKED_USER");
      }

      const privacy = await AccountRepository.getPrivacySettings(authorId);
      if (privacy && privacy.isPrivate) {
        const isFollowing = await ConnectionRepository.findFollow(viewerId, authorId);
        if (!isFollowing) {
          throw new AppError("This account is private. Follow to view posts.", 403, "PRIVATE_ACCOUNT");
        }
      }
    }

    const result = await PostRepository.findByAuthorId(authorId, limit, cursor, viewerId);
    return {
      items: result.items.map((p) => PostService.mapPostToResponse(p as unknown as PostDbRecord, viewerId)),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }
}
