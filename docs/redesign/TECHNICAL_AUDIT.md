# POPPIN — Comprehensive Technical Audit & Architectural Diagnosis

<!-- redesign:technical-audit v1.0.0 -->

## 1. Executive Diagnostic Summary

A deep audit of the POPPIN repository reveals a capable underlying technology stack (Next.js 15.5 App Router, React 19, TypeScript 5.7, Prisma 5.22, Neon PostgreSQL, Socket.IO 4.x, Cloudinary) that has suffered from **fragmented development, architectural divergence between mock data and database persistence, inconsistent session handling, and uncoordinated UI styling**.

While core database migrations were successfully deployed to Neon PostgreSQL, the user perceived that "there are no tables and data is not being persisted" because:
1. Key frontend views (such as `app/communities/[slug]/page.tsx` and `app/(main)/feed/page.tsx`) bypassed PostgreSQL and read from hardcoded mock constants (`INITIAL_COMMUNITIES`, `SUGGESTED_CREATORS`).
2. Zero initial seed data existed in PostgreSQL for posts, communities, and followers, causing queries to return empty arrays that prompted frontend fallback mocks.
3. Dual Prisma schemas (`prisma/schema.prisma` targeting SQLite and `prisma/postgresql/schema.prisma` targeting PostgreSQL) created split-brain generation where default `npx prisma` CLI commands targeted local SQLite files (`dev.db`).
4. Authentication session management was split between an HTTP-only cookie (`poppin_token`) and client-side `localStorage` (`poppin_jwt`), causing slow client-side redirect loops and repeated loading states.

---

## 2. Deep-Dive Component Audit

```
+--------------------------------------------------------------------------------------------------+
| ARCHITECTURAL AUDIT MAP                                                                          |
+--------------------------------------------------------------------------------------------------+
| LAYER            STATUS       CRITICAL FINDINGS                                                 |
+--------------------------------------------------------------------------------------------------+
| Database (Neon)  PARTIAL      Tables exist, but dual schema config causes tooling drift; 0 seed.  |
| Auth & Sessions  DEGRADED     Cookie vs localStorage mismatch; middleware lacks route guards.    |
| Social Feed      DEGRADED     Cursor pagination broken; mock creators hardcoded in feed/page.    |
| Communities      BROKEN       app/communities/[slug] imports INITIAL_COMMUNITIES mock file.      |
| Real-time Socket HEALTHY/ISOL Standalone server verified (15 tests pass), needs UI hook tie-in.  |
| Media Storage    DEGRADED     Signed Cloudinary works; frontend uploaders inconsistent.          |
| UI / Shell       DEGRADED     Navbar rendered everywhere; no persistent sidebar; mixed colors.   |
+--------------------------------------------------------------------------------------------------+
```

### 2.1 Database & Persistence Layer

#### Findings:
- **Neon PostgreSQL Status:** Actual connectivity to Neon pooled database is working. The database currently contains 23 tables:
  `User`, `Profile`, `Onboarding`, `PrivacySettings`, `PasswordResetToken`, `Follow`, `Block`, `UserReport`, `Post`, `Like`, `Comment`, `SavedPost`, `Conversation`, `ConversationMember`, `Message`, `MessageReceipt`, `MessageAttachment`, `Notification`, `Community`, `CommunityMember`, `Media`, `PostMedia`, `_prisma_migrations`.
- **Table Counts Found:** `User`: 31, `Profile`: 17, `Post`: 0, `Community`: 0, `Conversation`: 21, `Message`: 60, `Notification`: 4.
- **The Root Cause of "No Data / No Tables":**
  1. `prisma/schema.prisma` has `provider = "sqlite"` and `url = env("DATABASE_URL")`. When developers run standard `npx prisma studio` or `npx prisma db push`, it operates on `prisma/dev.db` rather than Neon PostgreSQL!
  2. The PostgreSQL schema is isolated in `prisma/postgresql/schema.prisma` and requires `--schema=prisma/postgresql/schema.prisma`.
  3. No PostgreSQL seed script existed (`npm run seed`), meaning fresh instances had 0 communities and 0 posts.
  4. In `app/communities/[slug]/page.tsx`, line 7 directly imports:
     ```typescript
     import { INITIAL_COMMUNITIES } from "@/lib/mock-communities";
     ```
     This completely bypassed PostgreSQL, meaning newly created communities were never visible when navigating to `communities/[slug]`.

#### Remediation Required:
- Standardize the primary Prisma schema for PostgreSQL with direct pooling configurations.
- Provide a robust seed script (`scripts/seed-postgresql.ts`) that populates initial communities, posts, and sample interactions.
- Completely excise `lib/mock-communities.ts` from all route handlers and frontend pages.

---

### 2.2 Authentication & Session Architecture

#### Findings:
- **Cookie vs. LocalStorage Split:**
  - In `app/api/v1/auth/login/route.ts`: Sets an HTTP-only cookie named `poppin_token`.
  - In `context/AuthContext.tsx`: Looks for `localStorage.getItem("poppin_jwt")`.
  - Result: If the user refreshes the page, `AuthContext` makes an extra asynchronous request to `/api/v1/auth/me` with the bearer token from localStorage. If that request is delayed or fails, the user is abruptly logged out or redirected.
- **Missing Middleware Protection:**
  - `middleware.ts` only intercepts `/api/:path*`.
  - Authenticated routes like `/feed`, `/communities`, `/settings`, `/profile`, `/messages` are completely un-guarded on the edge/server!
  - Protection is currently implemented via client-side `useEffect` in individual pages:
    ```typescript
    useEffect(() => {
      if (!isLoading && !user) router.push("/login");
    }, [isLoading, user]);
    ```
    This causes visible content flashes, layout shifts, and redirect lag.
- **Login Redirect Target:**
  - On login (`app/login/page.tsx:59`), the code executes `router.push("/profile")` instead of `/feed` or checking whether onboarding was completed.

#### Remediation Required:
- Synchronize token handling: Use the HTTP-only cookie `poppin_token` as the primary session token, with unified client-side synchronization.
- Implement server-side route guarding in `middleware.ts`: redirect unauthenticated visitors from `/feed`, `/communities`, `/settings`, `/messages` to `/login?next=...`.
- Redirect authenticated users attempting to access `/login` or `/register` directly to `/feed`.

---

### 2.3 Application Shell & Navigation

#### Findings:
- **Navbar Rendered Everywhere:**
  - `components/Navbar.tsx` is placed directly in `app/layout.tsx`. It appears on the public landing page (`/`), on `/login`, and on `/register`.
- **Missing Sidebar:**
  - No persistent authenticated sidebar exists anywhere in the codebase.
  - The user explicitly requested an authenticated shell with a persistent sidebar (Home, Communities, Messages, collapsible joined communities, profile, settings) and a top application bar with a search bar, notification dropdown popover, and post creation trigger.
- **Notification Navigation Tab:**
  - Currently, `/notifications` is a top-level navbar link. The user explicitly mandated that notifications must NOT be a dedicated primary sidebar tab, but an unread badge + popover in the top application bar.

#### Remediation Required:
- Create two distinct shell layouts:
  1. **Public Shell:** Landing page (`/`), Login (`/login`), Register (`/register`) with a public header (logo, Get Started, Login) and zero authenticated sidebar.
  2. **Authenticated Shell:** Persistent collapsible sidebar + top application bar wrapping `/feed`, `/communities`, `/messages`, `/profile`, `/settings`.

---

### 2.4 Social Feed & Post Persistence

#### Findings:
- **Cursor Pagination Deficiencies:**
  - `FeedService.getFeed` currently attempts cursor-based pagination, but lacks a composite index on `[createdAt, id]` in Prisma, resulting in sequential scans.
  - On the frontend (`app/(main)/feed/page.tsx`), the feed component does not properly preserve scroll position or handle empty states gracefully when no followed creators exist.
  - Hardcoded `SUGGESTED_CREATORS` array with Unsplash images is rendered in the feed sidebar.
- **Comment Presentation:**
  - Comments in some areas navigate away rather than expanding inline directly under the post card with threaded replies.

#### Remediation Required:
- Implement genuine cursor-based infinite scroll with `useInfiniteQuery` or IntersectionObserver hook.
- Inline comment drawer/accordion directly beneath each post card.
- Dynamic suggested creators queried from `/api/v1/users/suggestions` instead of hardcoded arrays.

---

### 2.5 Communities Architecture

#### Findings:
- **Mock Fallback Abuse:** As uncovered in `app/communities/[slug]/page.tsx`, the route uses `INITIAL_COMMUNITIES` from `lib/mock-communities.ts`.
- **Missing Member Management:** While `CommunityMember` table exists with roles (`ADMIN`, `MODERATOR`, `MEMBER`), the UI lacks membership toggles, admin moderation badges, and community-specific feeds.
- **Discussions vs. Group Messaging Ambiguity:** No clear separation existed between community forum discussions (public, threaded) and private real-time group conversations.

#### Remediation Required:
- Replace all mock references with live API calls to `/api/v1/communities/${slug}`.
- Distinct community discussion feeds with moderator badges.
- Separate private group chats (handled by Socket.IO messaging) from public community hubs.

---

### 2.6 Real-Time Messaging & Presence

#### Findings:
- Standalone Socket.IO server (`realtime-server/`) is architecturally sound and passed all 15 automated integration tests on port 4000 against Neon PostgreSQL.
- However, the frontend chat client (`lib/socket/client.ts`) is not globally initialized within the application shell, meaning presence and unread counts are not updated when the user is outside `/messages`.

#### Remediation Required:
- Initialize the Socket.IO client in the authenticated application shell provider (`SocketProvider`).
- Broadcast notification events over the socket to update the topbar bell badge in real-time.

---

### 2.7 Media Pipeline (Cloudinary)

#### Findings:
- Backend signature generation (`app/api/v1/cloudinary/signature/route.ts`) is fully functional and secure.
- Direct uploads from browser to Cloudinary work, but the frontend upload state handling is fragmented across different custom components (`FileUpload.tsx`, `post-composer.tsx`, `MessageInput.tsx`).
- Media records in PostgreSQL `Media` are not consistently created for all avatar and banner uploads.

#### Remediation Required:
- Unified `useCloudinaryUpload` hook with progress tracking, error handling, and automated Prisma `Media` record creation.

---

### 2.8 Styling & Design Slop

#### Findings:
- Inconsistent color classes: `bg-[#0f172a]`, `text-blue-600`, `bg-[#FF4500]` (Reddit orange), and purple gradient badges.
- Random emojis found in headings, buttons, and status labels (`✨`, `🔥`, `🚀`).
- Mixed icon sizing (some 16px, some 28px).

#### Remediation Required:
- Full purge of colorful gradients and emojis.
- Enforce the Monochromatic Design System tokens across all components.

