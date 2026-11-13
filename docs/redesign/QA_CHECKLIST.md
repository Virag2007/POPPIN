# POPPIN — Comprehensive Quality Assurance & Verification Checklist

<!-- redesign:qa-checklist v1.0.0 -->

## 1. Overview & Verification Protocol

This document establishes the exhaustive quality assurance checklist for the POPPIN application redesign. Every item in this checklist must be verified across local development (`http://localhost:3000` for Next.js, `http://localhost:4000` for the Socket.IO real-time server, Neon PostgreSQL for persistence, and Cloudinary for media storage).

---

## 2. Area-by-Area Verification Checklists

### 2.1 Authentication & Session Management
- [ ] **Registration Flow:**
  - [ ] Debounced live username availability check responds under 300ms.
  - [ ] Valid registration creates `User` and `Profile` in Neon PostgreSQL.
  - [ ] Duplicate email or username returns appropriate `409 Conflict` error without crash.
  - [ ] Passwords < 8 or > 72 characters rejected with clean inline validation error.
- [ ] **Login Flow:**
  - [ ] Successful login sets HTTP-only `poppin_token` cookie and updates `AuthContext`.
  - [ ] Incorrect password returns `401 Unauthorized` ("Invalid email or password").
  - [ ] Deterministic redirect: users with completed profiles redirect to `/feed`; incomplete redirect to `/onboarding`.
- [ ] **Session & Token Persistence:**
  - [ ] Page reload preserves session without flashing unauthenticated screens.
  - [ ] Logout clears cookie, resets `AuthContext`, disconnects Socket.IO, and redirects to `/login`.
  - [ ] Invalidation: incrementing `tokenVersion` immediately rejects subsequent requests.
- [ ] **Route Protection:**
  - [ ] Visiting `/feed`, `/communities`, `/messages`, `/profile`, `/settings` without auth redirects to `/login?next=...`.
  - [ ] Visiting `/login` or `/register` while authenticated redirects directly to `/feed`.

---

### 2.2 Database Persistence & Seed Verification
- [ ] **Neon PostgreSQL Connectivity:**
  - [ ] Connection pool handles concurrent requests without exhaustion (`connection_limit=10`).
  - [ ] Interactive transactions execute with adequate timeouts (25s) avoiding `P2028`.
- [ ] **Zero Mock Reliance:**
  - [ ] `lib/mock-communities.ts` is eliminated from all active imports.
  - [ ] Feed, community, profile, and messaging views read 100% live data from PostgreSQL.
- [ ] **Seed Script Execution (`npm run seed`):**
  - [ ] Populates at least 5 default communities across Engineering, Design, AI, Founders.
  - [ ] Creates default test users with verified handles (`@alex_design`, `@sarah_code`, etc.).
  - [ ] Creates initial seed posts with media, tags, and comments.
- [ ] **Data Integrity & Cascades:**
  - [ ] Deleting a post cascades and removes its `Comment`, `Like`, `SavedPost`, and `PostMedia` records.
  - [ ] Deleting an account removes profile, authored content, and membership links cleanly.

---

### 2.3 Social Feed & Post Lifecycle
- [ ] **Post Creation:**
  - [ ] Text post creates `Post` record with markdown support.
  - [ ] Image/video upload uploads to Cloudinary, creates `Media` record, links `PostMedia`, and renders preview.
  - [ ] Post appears immediately at the top of the feed without requiring full page refresh.
- [ ] **Cursor-Based Infinite Scrolling:**
  - [ ] Scrolling down triggers next page fetch when intersecting sentinel element.
  - [ ] Zero duplicate posts rendered across pagination batches.
  - [ ] Reaching end of feed displays subtle "You're all caught up" message.
  - [ ] Feed scroll position is preserved when navigating back from detail or profile views.
- [ ] **Reactions & Inline Comments:**
  - [ ] Like button toggles instantly (optimistic UI) and persists in PostgreSQL.
  - [ ] Comment button expands inline drawer directly below post card (no page redirect).
  - [ ] Adding a comment renders immediately; threaded replies indent cleanly.

---

### 2.4 Communities & Hub Discussions
- [ ] **Community Discovery (`/communities`):**
  - [ ] Category filtering (Engineering, Design, AI, Founders) filters list dynamically.
  - [ ] Search query filters communities by name and description in real-time.
  - [ ] Create Community modal validates slug uniqueness and persists new community.
- [ ] **Community Detail (`/communities/[slug]`):**
  - [ ] Banner, avatar, description, rules, and moderator list render from PostgreSQL.
  - [ ] Join/Leave toggle updates `CommunityMember` and increments/decrements member counter.
  - [ ] Post creation inside community attaches `communityId` and renders in community-scoped feed.
  - [ ] Sidebar "My Communities" updates reactively when user joins or leaves.

---

### 2.5 Real-Time Messaging (Socket.IO on `localhost:4000`)
- [ ] **Handshake & Security:**
  - [ ] Unauthenticated socket connections rejected during handshake with `401 Unauthorized`.
  - [ ] Valid JWT connects and associates socket with verified `userId`.
- [ ] **Direct & Group Conversations:**
  - [ ] Sending message delivers instantaneously to recipient's active socket (< 100ms).
  - [ ] Message is persisted in PostgreSQL before broadcast.
  - [ ] Duplicate client message IDs are ignored (idempotent deduplication).
  - [ ] Multi-device sync: user logged in on two tabs/browsers receives messages on both.
- [ ] **Presence & Typing State:**
  - [ ] Active users display green online indicator dot.
  - [ ] Typing in input sends `typing:start`; typing indicator bubble appears for recipient.
  - [ ] Typing indicator automatically expires after 4 seconds of inactivity or on `typing:stop`.
- [ ] **Receipts & Status:**
  - [ ] Single checkmark = Sent to server.
  - [ ] Double checkmark = Delivered to recipient device.
  - [ ] Highlighted double checkmark = Read by recipient (updates `lastReadMessageId`).
- [ ] **Attachments:**
  - [ ] Direct Cloudinary upload attaches media to message with lightbox preview.

---

### 2.6 Notifications System
- [ ] **Top Application Bar Bell:**
  - [ ] Unread notification count badge displays accurate count.
  - [ ] Clicking bell opens popover dropdown (no page navigation).
  - [ ] New notification pushes dynamically via Socket.IO in real-time.
- [ ] **Actions & State:**
  - [ ] Clicking notification marks it as read and decrements unread counter.
  - [ ] "Mark all as read" button updates all pending notifications in batch.
  - [ ] Notification links navigate to target post, comment, or profile.
  - [ ] Notifications tab is strictly absent from the primary left sidebar.

---

### 2.7 Navigation & Application Shell
- [ ] **Two Application Shell States:**
  - [ ] Public state (Landing, Login, Register): Zero authenticated sidebar rendered.
  - [ ] Authenticated state (`/feed`, `/communities`, `/messages`, `/profile`, `/settings`): Persistent sidebar visible.
- [ ] **Left Sidebar Structure:**
  - [ ] Primary links: Home (`/feed`), Communities (`/communities`), Messages (`/messages`).
  - [ ] Collapsible "My Communities" list showing joined communities.
  - [ ] Quick action: "Create Community".
  - [ ] User profile pill and account settings link at bottom.
- [ ] **Top Application Bar:**
  - [ ] Universal search trigger (Cmd+K modal).
  - [ ] Notification bell popover.
  - [ ] "Create Post" button opens modal.
  - [ ] User avatar dropdown (Profile, Settings, Log Out).

---

### 2.8 Design System & Visual Quality (Hallmark / Impeccable / Taste-Skill / UI-UX-Pro-Max)
- [ ] **Monochromatic Discipline:**
  - [ ] Canvas is warm off-white (`#FCFBF9`); surfaces are crisp white (`#FFFFFF`).
  - [ ] Text is near-black (`#09090B`) or charcoal (`#18181B`); muted labels are grey (`#71717A`).
  - [ ] Zero random colorful gradients or glowing mesh blobs.
  - [ ] Zero emojis as icons; 100% of icons imported from `lucide-react` with 1.75–1.85 stroke.
- [ ] **Typography Hierarchy:**
  - [ ] `Unbounded` used exclusively for primary hero title, brand wordmark, and major display headings.
  - [ ] `Plus Jakarta Sans` used for all body text, comments, inputs, buttons, and labels.
- [ ] **Layout & Chrome Craft:**
  - [ ] Equal left and right content edges across all breakpoints.
  - [ ] Zero nested bordered cards.
  - [ ] Custom browser surfaces: themed text selection, dark caret, subtle neutral scrollbars.
  - [ ] Diffused ambient shadows (no colored halos or zero-blur hard block drop shadows).

---

### 2.9 Responsive Layout & Mobile Usability
- [ ] **Desktop (`1440px+`):** Full 240px sidebar, centered feed (640px), right suggestions rail (320px).
- [ ] **Tablet (`768px – 1023px`):** Sidebar collapses to compact icon rail or slide-out drawer; content centers.
- [ ] **Mobile (`390px / < 768px`):**
  - [ ] Sidebar collapses to bottom navigation bar or topbar drawer menu.
  - [ ] Touch targets are minimum 44px × 44px with at least 8px spacing.
  - [ ] Viewport height uses `min-h-[100dvh]` to eliminate iOS Safari address bar jump.
  - [ ] Zero horizontal scroll or overflowing containers.

---

### 2.10 Performance & Core Web Vitals
- [ ] **Loading & Hydration:**
  - [ ] Largest Contentful Paint (LCP) < 1.8s.
  - [ ] Cumulative Layout Shift (CLS) < 0.05.
  - [ ] Zero React hydration mismatch warnings in browser console.
  - [ ] Images served in WebP/AVIF with explicit dimensions or fill layout.
- [ ] **Bundle & Memory:**
  - [ ] Single Socket.IO client instance reused across route transitions (no duplicate sockets).
  - [ ] Heavy dialogs and Cloudinary uploaders dynamically imported where appropriate.

---

### 2.11 Security & Data Privacy
- [ ] **Credential Safety:**
  - [ ] `CLOUDINARY_API_SECRET`, `JWT_SECRET`, `DATABASE_URL` never exposed in client bundles or public API responses.
  - [ ] Password hashes generated via `bcryptjs` (salt rounds: 12); raw passwords never logged.
- [ ] **Access Control & Ownership:**
  - [ ] Users cannot edit or delete posts, comments, or profiles belonging to other users (`403 Forbidden`).
  - [ ] Blocked users cannot view profile, send messages, or comment on posts.
  - [ ] Account deletion requires explicit confirmation and cascades data cleanly.

---

### 2.12 Accessibility (WCAG AA Compliance)
- [ ] **Contrast:** Text-to-background contrast ratio ≥ 4.5:1 for body text, ≥ 3.0:1 for large display headings.
- [ ] **Keyboard Navigation:** Full tab-order navigability across all forms, modals, menus, and post actions. Visible focus ring (`focus:ring-2 focus:ring-zinc-950/20`).
- [ ] **Screen Readers:** Meaningful `aria-label` attributes on icon-only buttons (bell, search, like, send).
- [ ] **Reduced Motion:** Animations respect `@media (prefers-reduced-motion: reduce)`.

