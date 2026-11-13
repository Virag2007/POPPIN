import { prisma } from "@/lib/db";
import { CreatePostInput, UpdatePostInput } from "@/types";

export class PostRepository {
  static async create(authorId: string, data: CreatePostInput) {
    const linksJson = JSON.stringify(data.links || []);
    const tagsJson = JSON.stringify(data.tags || []);

    return prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          communityId: data.communityId || null,
          content: data.content,
          type: data.type,
          links: linksJson,
          tags: tagsJson,
        },
      });

      if (data.media && data.media.length > 0) {
        await tx.postMedia.createMany({
          data: data.media.map((item, index) => ({
            postId: post.id,
            url: item.url,
            key: item.key || null,
            mimeType: item.mimeType || null,
            size: item.size || null,
            order: item.order !== undefined ? item.order : index,
          })),
        });
      }

      return tx.post.findUnique({
        where: { id: post.id },
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
        },
      });
    });
  }

  static async findById(postId: string, currentUserId?: string) {
    return prisma.post.findUnique({
      where: { id: postId },
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
        ...(currentUserId
          ? {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
              saves: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });
  }

  static async findAuthorId(postId: string): Promise<string | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    return post ? post.authorId : null;
  }

  static async findMediaKeysByPostId(postId: string): Promise<string[]> {
    const media = await prisma.postMedia.findMany({
      where: { postId },
      select: { key: true },
    });
    return media
      .map((m) => m.key)
      .filter((k): k is string => typeof k === "string" && k.length > 0);
  }

  static async update(postId: string, data: UpdatePostInput) {
    return prisma.$transaction(async (tx) => {
      const updateData: {
        content?: string;
        type?: string;
        links?: string;
        tags?: string;
      } = {};

      if (data.content !== undefined) updateData.content = data.content;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.links !== undefined) updateData.links = JSON.stringify(data.links);
      if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

      if (Object.keys(updateData).length > 0) {
        await tx.post.update({
          where: { id: postId },
          data: updateData,
        });
      }

      // If media array is provided, replace media items preserving explicit order
      if (data.media !== undefined) {
        await tx.postMedia.deleteMany({
          where: { postId },
        });

        if (data.media.length > 0) {
          await tx.postMedia.createMany({
            data: data.media.map((item, index) => ({
              postId,
              url: item.url,
              key: item.key || null,
              mimeType: item.mimeType || null,
              size: item.size || null,
              order: item.order !== undefined ? item.order : index,
            })),
          });
        }
      }

      return tx.post.findUnique({
        where: { id: postId },
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
        },
      });
    });
  }

  static async delete(postId: string) {
    return prisma.post.delete({
      where: { id: postId },
    });
  }

  static async findByAuthorId(
    authorId: string,
    limit = 20,
    cursor?: string,
    currentUserId?: string
  ) {
    const take = Math.min(limit, 50);
    const query: any = {
      where: { authorId },
      take: take + 1,
      orderBy: { createdAt: "desc" },
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
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        saves: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const items = await prisma.post.findMany(query);
    const hasMore = items.length > take;
    const records = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? records[records.length - 1]?.id || null : null;

    return {
      items: records,
      hasMore,
      nextCursor,
    };
  }
}

