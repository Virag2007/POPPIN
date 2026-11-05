# Developer 2 Integration & Coordination Guide
Identity, Follow Data, Privacy, and Blocking Contracts for Developer 2 (Posts, Feed, Messaging, Notifications)

---

## 1. Authentication & Identity Contract
- All authenticated API routes must extract user credentials from `Authorization: Bearer <token>` or the `poppin_token` HTTP cookie.
- Token decoding helper: `verifyToken(token)` in `lib/auth/jwt.ts` returns `{ userId, email }`.
- Reusable auth middleware: `getAuthenticatedUser(request)` in `lib/auth/middleware.ts` retrieves the full authenticated user record.
- Reusable ownership check: `checkOwnership(resourceOwnerId, currentUserId)` ensures users can only mutate resources they own.

---

## 2. Follow Relationship Contract (Following Feed & Notifications)
- Database Model: `prisma.follow`
  ```prisma
  model Follow {
    id          String   @id @default(uuid())
    followerId  String
    follower    User     @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
    followingId String
    following   User     @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)
    createdAt   DateTime @default(now())

    @@unique([followerId, followingId])
  }
  ```
- **Following Feed**: Developer 2 should query `prisma.follow.findMany({ where: { followerId: currentUserId }, select: { followingId: true } })` to obtain the list of author IDs whose posts should populate the feed.
- **New Follower Notification**: Developer 1 emits the following event payload on `POST /api/v1/users/{userId}/follow`:
  ```json
  {
    "event": "NEW_FOLLOWER",
    "followerId": "<user-id-who-followed>",
    "targetUserId": "<user-id-followed>",
    "timestamp": "2026-11-05T01:38:00.000Z"
  }
  ```

---

## 3. Block & Safety Contract (Content Visibility & Messaging Restrictions)
- Database Model: `prisma.block`
  ```prisma
  model Block {
    id        String   @id @default(uuid())
    blockerId String
    blocker   User     @relation("UserBlocks", fields: [blockerId], references: [id], onDelete: Cascade)
    blockedId String
    blocked   User     @relation("UserBlockedBy", fields: [blockedId], references: [id], onDelete: Cascade)
    createdAt DateTime @default(now())

    @@unique([blockerId, blockedId])
  }
  ```
- **Content Visibility**: Developer 2 should ensure posts/comments from users where `blockerId == currentUserId` OR `blockedId == currentUserId` are hidden from views and feeds.
- **Direct Messaging**: When initiating a chat or sending a message, Developer 2 should verify `ConnectionRepository.isBlockedOrBlocking(senderId, recipientId)`. If true, return `403 Forbidden` (`BLOCKED_USER`).

---

## 4. Privacy Settings Contract
- Database Model: `prisma.privacySettings`
  ```prisma
  model PrivacySettings {
    id                 String   @id @default(uuid())
    userId             String   @unique
    user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    isPrivate          Boolean  @default(false)
    showActivityStatus Boolean  @default(true)
    allowTagging       Boolean  @default(true)
    createdAt          DateTime @default(now())
    updatedAt          DateTime @updatedAt
  }
  ```
- **Private Profiles**: When `isPrivate == true`, Developer 2 should restrict post/media access to users who are confirmed followers.
- **Activity Status**: If `showActivityStatus == false`, real-time presence/last seen should be hidden in messaging.
- **Tagging**: If `allowTagging == false`, disallow tagging this user in posts or comments.

