export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
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
  createdAt: Date;
  updatedAt: Date;
}
