# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are creative builders, developers, designers, and tech innovators who want to showcase their projects, curate their digital identity, discover like-minded peers, and collaborate in real-time.

- **Creative coders & software engineers:** Building indie projects, open-source work, and looking for peers, collaborators, and recognition beyond traditional resumes.
- **Product designers & visual creators:** Sharing interactive components, design prototypes, and community showcases.
- **Tech community builders:** Launching interest-based community hubs and driving real-time group conversations.

## Product Purpose

POPPIN is the social identity and community platform that bridges the gap between static professional profiles (like LinkedIn) and fragmented developer/creator channels (like X or Discord). It exists to give digital builders an expressive, live, and credible home for their work and interactions.

Success means:
1. High conversion on landing: visitors instantly grasp the product value, probe an available handle, and create an account.
2. Active identity adoption: users complete their profile with verified skills, links, experience, and custom aesthetics.
3. Engaging real-time community interaction: users participate in builder feeds, join communities, and communicate with zero-latency real-time chat.

## Positioning

POPPIN positions itself as a **creative identity & social portfolio** platform that combines:
- **Instant claimable builder identity:** Live handle availability checking and rich creative profiles showcasing skills, projects, and social proof.
- **Real-time native collaboration:** Low-latency 1-on-1 and group messaging with typing indicators, presence, and read receipts natively woven into the social experience.
- **Interactive builder feeds & communities:** Media-rich updates, community spaces, and direct peer networking without corporate fluff.

Neighboring corporate networks focus on job hunting and resume bullets; neighboring chat apps lack permanent identity and discovery. POPPIN unifies portfolio identity, public feeds, and real-time messaging into one playful yet professional environment.

## Operating Context

- **Environment:** Responsive desktop and mobile modern web browsers (Chrome, Safari, Firefox, Edge).
- **Session Types:**
  - Fast mobile visits: checking notifications, replying to real-time direct messages, scanning recent feed posts.
  - Deep desktop sessions: composing rich posts with media attachments, configuring profile portfolio details, and exploring communities.
- **Connected Ecosystem:**
  - Next.js 15.5 App Router + React 19 + Tailwind CSS.
  - Standalone dedicated Socket.IO 4.x real-time server for instant messaging and presence.
  - PostgreSQL (Neon) persistence with Prisma ORM.
  - Cloudinary for direct signed image/media uploads.
  - JWT (HS256) session security and bcrypt authentication.

## Capabilities and Constraints

- **Confirmed Functionality:**
  - Full auth lifecycle: Email/password registration, login, Google OAuth, JWT cookies, forgot/reset password.
  - User profiles: @username availability checker, headline, bio, location, avatar, cover photo, skills, interests, links, experience, and education.
  - Onboarding: 3-step progressive onboarding (role/headline, skills/interests, follow suggestions).
  - Social graph: Follow/unfollow, mutual connections, profile suggestions, user blocking, and reporting.
  - Feeds & Posts: Multimedia post creation with Cloudinary uploads, likes, comments, and hashtags.
  - Communities: Niche community creation, member joins, and community-specific feeds.
  - Real-Time Messaging: Dedicated Socket.IO server handling 1-on-1 and group chats, typing indicators, active presence, message delivery/read receipts, soft-deletion, and image attachments.
- **Technical Constraints:**
  - Node.js runtime for API handlers and standalone Socket.IO server on Railway.
  - No permanent in-memory message storage (database is single source of truth).
  - Preserved Next.js 15.5 and React 19 stack without version upgrades.

## Brand Commitments

- **Tone & Personality:** Playful yet professional. Vibrant, energetic, and inspiring for creative builders, while maintaining crisp precision, typographic restraint, and technical credibility.
- **Visual Goal:** High-craft, compelling landing experience that immediately convinces visitors of the platform's utility and quality, paired with intuitive, snappy app surfaces.
- **Name:** POPPIN (Poppin.).

## Evidence on Hand

- Fully functional authentication, profile, onboarding, and social graph API under `app/api/v1/`.
- Verified live PostgreSQL schema with migrations for users, profiles, posts, comments, communities, and real-time messaging.
- Dedicated standalone Socket.IO real-time server in `realtime-server/` with passing integration test suite (`tests/realtime-socket.test.ts`).
- Established landing page, navigation bar, auth modals, feed composer, and messaging components.

## Product Principles

1. **Identity First:** Everything centers on giving builders a credible, expressive, and distinct digital presence.
2. **Playful Yet Professional:** Balance joyful micro-interactions and bold personality with the clarity, speed, and reliability demanded by professionals.
3. **Persuasive From the First Screen:** The landing page must earn immediate conviction through live interaction, clear proof, and zero generic marketing fluff.
4. **Instant & Live:** Messaging and presence feel instantaneous; social state updates reactively without jarring page reloads.
5. **No Slop:** Every interaction, empty state, form, and dialog is deliberate, clean, and respectful of the user's attention.

## Accessibility & Inclusion

- Responsive typography and layout adhering to WCAG AA contrast standards.
- Full keyboard navigability across search, modals, menus, and messaging inputs.
- Meaningful ARIA labels for status indicators (online/offline presence, message receipts, loading states).

