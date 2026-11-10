import { FeedRepository } from "@/repositories/feed.repository";
import {
  PostResponse,
  PostType,
  PostMediaItem,
  CursorPaginatedResult,
} from "@/types";

interface PostDbRecord {
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

export class FeedService {
  private static parseJsonSafely<T>(value: unknown, fallback: T): T {
    if (typeof value !== "string") return (value as T) ?? fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private static mapPostToResponse(
    post: PostDbRecord,
    currentUserId?: string
  ): PostResponse {
    const rawLinks = FeedService.parseJsonSafely<{ title: string; url: string }[]>(
      post.links,
      []
    );
    const rawTags = FeedService.parseJsonSafely<string[]>(post.tags, []);

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

    const isLiked = currentUserId && post.likes ? post.likes.length > 0 : undefined;
    const isSaved = currentUserId && post.saves ? post.saves.length > 0 : undefined;

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

  static async getFollowingFeed(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<CursorPaginatedResult<PostResponse>> {
    const { posts, nextCursor, hasMore } = await FeedRepository.getFollowingFeed(
      userId,
      limit,
      cursor
    );

    const items = posts.map((post) => FeedService.mapPostToResponse(post, userId));

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  static async getForYouFeed(
    userId?: string,
    limit = 20,
    cursor?: string
  ): Promise<CursorPaginatedResult<PostResponse>> {
    const { posts, nextCursor, hasMore } = await FeedRepository.getForYouFeed(
      userId,
      limit,
      cursor
    );

    const items = posts.map((post) => FeedService.mapPostToResponse(post, userId));

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}

