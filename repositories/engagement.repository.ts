import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http/response";

export class EngagementRepository {
  // ==========================================
  // LIKES
  // ==========================================
  static async likePost(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    return prisma.$transaction(async (tx) => {
      // Idempotent like: check if already liked
      const existing = await tx.like.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      });

      if (!existing) {
        await tx.like.create({
          data: {
            userId,
            postId,
          },
        });
      }

      const likesCount = await tx.like.count({
        where: { postId },
      });

      return { liked: true, likesCount };
    });
  }

  static async unlikePost(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    return prisma.$transaction(async (tx) => {
      // Idempotent unlike
      const existing = await tx.like.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      });

      if (existing) {
        await tx.like.delete({
          where: { id: existing.id },
        });
      }

      const likesCount = await tx.like.count({
        where: { postId },
      });

      return { liked: false, likesCount };
    });
  }

  static async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
      select: { id: true },
    });
    return !!like;
  }

  static async getLikesCount(postId: string): Promise<number> {
    return prisma.like.count({
      where: { postId },
    });
  }

  // ==========================================
  // COMMENTS (Strictly 1-Level Nesting)
  // ==========================================
  static async createComment(postId: string, authorId: string, content: string, replyToCommentId?: string) {
    if (replyToCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: replyToCommentId },
        select: { id: true, postId: true, replyToCommentId: true },
      });

      if (!parent || parent.postId !== postId) {
        throw new AppError("Parent comment not found on this post", 404, "PARENT_COMMENT_NOT_FOUND");
      }

      // Enforce strict 1-level reply constraint
      if (parent.replyToCommentId !== null) {
        throw new AppError(
          "Nested replies beyond one level are not supported. You can only reply to a top-level comment.",
          400,
          "NESTED_REPLIES_NOT_ALLOWED"
        );
      }
    }

    return prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        replyToCommentId: replyToCommentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async getCommentsByPostId(postId: string) {
    // Top-level comments with ordered 1-level replies
    return prisma.comment.findMany({
      where: {
        postId,
        replyToCommentId: null,
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static async findCommentById(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async updateComment(commentId: string, content: string) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async deleteComment(commentId: string) {
    return prisma.comment.delete({
      where: { id: commentId },
    });
  }

  // ==========================================
  // SAVED POSTS
  // ==========================================
  static async savePost(userId: string, postId: string): Promise<{ saved: boolean }> {
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existing) {
      await prisma.savedPost.create({
        data: {
          userId,
          postId,
        },
      });
    }

    return { saved: true };
  }

  static async unsavePost(userId: string, postId: string): Promise<{ saved: boolean }> {
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: { id: existing.id },
      });
    }

    return { saved: false };
  }

  static async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const saved = await prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
      select: { id: true },
    });
    return !!saved;
  }

  static async getSavedPosts(userId: string, limit = 20, cursor?: string) {
    const savedRecords = await prisma.savedPost.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatar: true,
                    headline: true,
                  },
                },
              },
            },
            media: {
              orderBy: { order: "asc" },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (savedRecords.length > limit) {
      hasMore = true;
      savedRecords.pop();
      nextCursor = savedRecords[savedRecords.length - 1].id;
    }

    return {
      records: savedRecords,
      nextCursor,
      hasMore,
    };
  }
}
