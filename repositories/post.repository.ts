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
}

