export interface AuthUser {
  id: string;
  email: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface EducationItem {
  id: string;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface ExternalLinkItem {
  title: string;
  url: string;
}

export interface SafeProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  coverImage: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  interests: string[];
  links: ExternalLinkItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  followersCount: number;
  followingCount: number;
  isPrivate?: boolean;
  showActivityStatus?: boolean;
  allowTagging?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string | null;
  };
  content: string;
  createdAt: string;
  likesCount?: number;
}

export interface FeedPost {
  id: string;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  authorHeadline?: string | null;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    role?: string;
    isFollowing?: boolean;
  };
  content: string;
  mediaUrl?: string | null;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  commentsCount: number;
  community?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: string[];
  comments?: PostComment[];
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: "Design" | "Engineering" | "AI & Research" | "Founders" | "General";
  avatar: string;
  coverImage: string;
  membersCount: number;
  isMember?: boolean;
  rules: string[];
  moderators: Array<{
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  }>;
}

export interface SuggestionItem {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  headline?: string | null;
  isFollowing?: boolean;
}

export * from "./content-communication";
