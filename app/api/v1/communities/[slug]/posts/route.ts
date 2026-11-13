import { NextRequest } from "next/server";
import { getOptionalAuthenticatedUser, getAuthenticatedUser } from "@/lib/auth/middleware";
import { CommunityRepository } from "@/repositories/community.repository";
import { prisma } from "@/lib/db";
import { PostService, PostDbRecord } from "@/services/post.service";
import { createPostSchema } from "@/lib/validation/post";
import { successResponse, handleRouteError, AppError } from "@/lib/http/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getOptionalAuthenticatedUser(request);

    const community = await CommunityRepository.findBySlug(slug);
    if (!community) {
      return handleRouteError({ statusCode: 404, message: "Community not found", code: "COMMUNITY_NOT_FOUND" });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const cursor = searchParams.get("cursor") || undefined;

    const posts = await prisma.post.findMany({
      where: { communityId: community.id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(viewer?.id
          ? {
              likes: {
                where: { userId: viewer.id },
                select: { id: true },
              },
              saves: {
                where: { userId: viewer.id },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const formattedPosts = items.map((post) =>
      PostService.mapPostToResponse(post as unknown as PostDbRecord, viewer?.id)
    );

    return successResponse(
      {
        items: formattedPosts,
        nextCursor,
        hasMore,
      },
      200
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getAuthenticatedUser(request);

    const community = await CommunityRepository.findBySlug(slug);
    if (!community) {
      return handleRouteError(new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND"));
    }

    // Check membership for posting if community is private
    if (community.isPrivate) {
      const isMember = await CommunityRepository.isMember(community.id, user.id);
      if (!isMember) {
        return handleRouteError(new AppError("Only members can post in this private community", 403, "NOT_COMMUNITY_MEMBER"));
      }
    }

    const body = await request.json();
    const validated = createPostSchema.parse({
      ...body,
      communityId: community.id,
    });

    const post = await PostService.createPost(user.id, validated);
    return successResponse(post, 201, "Discussion post created successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

