import { SearchRepository } from "@/repositories/search.repository";
import { prisma } from "@/lib/db";

export interface SearchResult {
  users: Array<{
    id: string;
    type: "user";
    title: string;
    subtitle: string;
    href: string;
    avatar?: string;
    badge?: string;
  }>;
  communities: Array<{
    id: string;
    type: "community";
    title: string;
    subtitle: string;
    href: string;
    avatar?: string;
    badge?: string;
  }>;
  posts: Array<{
    id: string;
    type: "post";
    title: string;
    subtitle: string;
    href: string;
    badge?: string;
  }>;
}

export class SearchService {
  static async search(
    rawQuery: string,
    type: "all" | "users" | "communities" | "posts" = "all",
    limit = 6
  ): Promise<SearchResult> {
    const query = rawQuery.trim();
    if (!query) {
      return { users: [], communities: [], posts: [] };
    }

    const shouldSearchUsers = type === "all" || type === "users";
    const shouldSearchCommunities = type === "all" || type === "communities";
    const shouldSearchPosts = type === "all" || type === "posts";

    const [rawUsers, rawCommunities, rawPosts] = await Promise.all([
      shouldSearchUsers ? SearchRepository.searchUsers(query, limit) : Promise.resolve([]),
      shouldSearchCommunities ? SearchRepository.searchCommunities(query, limit) : Promise.resolve([]),
      shouldSearchPosts ? SearchRepository.searchPosts(query, limit) : Promise.resolve([]),
    ]);

    const users = rawUsers.map((u) => ({
      id: u.userId,
      type: "user" as const,
      title: u.displayName || `@${u.username}`,
      subtitle: `@${u.username}${u.headline ? ` • ${u.headline}` : ""}`,
      href: `/profiles/${u.username}`,
      avatar: u.avatar || undefined,
      badge: "Creator",
    }));

    const communities = rawCommunities.map((c) => ({
      id: c.id,
      type: "community" as const,
      title: c.name,
      subtitle: `${c.tagline || c.category} • ${c._count.members} members`,
      href: `/communities/${c.slug}`,
      avatar: c.avatar || undefined,
      badge: c.category,
    }));

    const posts = rawPosts.map((p) => {
      const snippet = p.content.slice(0, 80) + (p.content.length > 80 ? "..." : "");
      return {
        id: p.id,
        type: "post" as const,
        title: snippet,
        subtitle: `By @${p.author.profile?.username || "user"} • ${p._count.likes} likes`,
        href: `/posts/${p.id}`,
        badge: p.type,
      };
    });

    return { users, communities, posts };
  }

  static async getExploreData() {
    const [trendingTags, topCreators, topCommunities, showcasePosts] = await Promise.all([
      SearchRepository.getTrendingTags(6),
      prisma.profile.findMany({
        take: 6,
        orderBy: { user: { followers: { _count: "desc" } } },
        include: {
          user: {
            include: {
              _count: { select: { followers: true } },
            },
          },
        },
      }),
      prisma.community.findMany({
        take: 3,
        orderBy: { members: { _count: "desc" } },
        include: {
          _count: { select: { members: true, posts: true } },
        },
      }),
      prisma.post.findMany({
        take: 6,
        orderBy: { likes: { _count: "desc" } },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          media: true,
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
    ]);

    return {
      trendingTopics: trendingTags.map((t) => ({
        tag: t.tag,
        count: t.count,
        category: "Trending",
      })),
      featuredCreators: topCreators.map((c) => ({
        id: c.userId,
        username: c.username,
        displayName: c.displayName || c.username,
        role: c.headline || "Poppin Creator",
        avatar: c.avatar || "",
        cover: c.coverImage || "",
        followersCount: c.user._count.followers,
        tags: (() => {
          try {
            return JSON.parse(c.skills || "[]");
          } catch {
            return [];
          }
        })(),
      })),
      featuredCommunities: topCommunities.map((cm) => ({
        id: cm.id,
        slug: cm.slug,
        name: cm.name,
        tagline: cm.tagline,
        avatar: cm.avatar,
        coverImage: cm.coverImage,
        membersCount: cm._count.members,
        category: cm.category,
      })),
      showcasePosts: showcasePosts.map((p) => ({
        id: p.id,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
        creator: p.author.profile?.displayName || p.author.profile?.username || "Creator",
        username: p.author.profile?.username || "user",
        avatar: p.author.profile?.avatar || "",
        image: p.media[0]?.url || "",
        likes: p._count.likes,
        comments: p._count.comments,
        type: p.type,
      })),
    };
  }
}

