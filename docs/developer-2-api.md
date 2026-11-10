# POPPIN Developer 2: Content & Communication API Documentation

This document provides the complete API specification, data models, realtime event contracts, and security rules implemented by **Developer 2 (Content & Communication)** in POPPIN.

---

## 1. Scope & Ownership

Developer 2 owns and maintains the following functional modules:
- **Posts & Media:** Creation, editing, retrieval, deletion, post types (`UPDATE`, `PROJECT_SHOWCASE`, `ACHIEVEMENT`, `LOOKING_FOR`), image ordering, tags, and media uploads.
- **Engagement:** Likes, comments, strict 1-level replies, post saves, counter synchronizations, and shareable post links.
- **Feed:** Following feed, For You feed (engagement-ranked), cursor pagination, and block/privacy visibility filters.
- **Messaging & Groups:** 1-on-1 direct conversations, group chats, admin role permissions, unread counters, typing indicators, and WebSocket delivery.
- **Notifications:** In-app notifications for likes, comments, follows, and messages, with unread counters and read status tracking.

---

## 2. Shared Response Envelope & Error Codes

All endpoints conform to the POPPIN unified response structure:

### Success Response
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
    "details": { ... }
  }
}
```

### Common Developer 2 Error Codes
| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Invalid JSON payload, malformed URLs, or schema constraint failure |
| `NESTED_REPLIES_NOT_ALLOWED` | 400 | Attempted to reply to a reply (only 1-level nesting permitted) |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Missing ownership, admin role, or blocked user relationship |
| `NOT_FOUND` | 404 | Target post, comment, conversation, or notification does not exist |
| `BLOCKED_USER` | 403 | Interaction blocked due to mutual blocking policy |

---

## 3. Endpoints Specification

### 3.1 Posts & Media

#### `POST /api/v1/posts`
Create a new post.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "content": "Building in public! #nextjs",
    "type": "PROJECT_SHOWCASE",
    "linkUrl": "https://github.com/org/repo",
    "tags": ["nextjs"],
    "media": [
      {
        "url": "https://images.poppin.io/img1.png",
        "storageKey": "uploads/img1.png",
        "mimeType": "image/png",
        "sizeBytes": 512000,
        "order": 0
      }
    ]
  }
  ```
- **Response:** `201 Created`

#### `GET /api/v1/posts/:postId`
Retrieve single post by ID with author details, like/save status for current viewer, and like/comment counts.
- **Auth:** Optional (honors private profile visibility rules)
- **Response:** `200 OK`

#### `PATCH /api/v1/posts/:postId`
Update post content, linkUrl, or tags.
- **Auth:** Required (Author only)
- **Response:** `200 OK`

#### `DELETE /api/v1/posts/:postId`
Delete post and cascade delete associated comments, likes, saves, and media keys.
- **Auth:** Required (Author only)
- **Response:** `200 OK`

#### `POST /api/v1/media/upload`
Upload an image (PNG, JPEG, WebP, GIF; max 10MB) to configured storage provider (Cloudinary/S3).
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Response:** `201 Created` with `url`, `storageKey`, `mimeType`, and `sizeBytes`.

---

### 3.2 Engagement

#### `POST /api/v1/posts/:postId/like`
Like a post idempotently. Increments `likesCount` and triggers `POST_LIKE` in-app notification.
- **Auth:** Required
- **Response:** `200 OK` `{ "liked": true, "likesCount": 1 }`

#### `DELETE /api/v1/posts/:postId/like`
Unlike a post idempotently. Decrements `likesCount`.
- **Auth:** Required
- **Response:** `200 OK` `{ "liked": false, "likesCount": 0 }`

#### `POST /api/v1/posts/:postId/comments`
Add a top-level comment or a 1-level reply.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "content": "Great milestone!",
    "replyToCommentId": null
  }
  ```
  *(Pass parent comment ID in `replyToCommentId` for a reply. Replying to an existing reply returns `400 NESTED_REPLIES_NOT_ALLOWED`)*
- **Response:** `201 Created`

#### `GET /api/v1/posts/:postId/comments`
Get comments nested as top-level comments each containing their 1-level `replies` array.
- **Auth:** Optional
- **Response:** `200 OK` with paginated comment trees.

#### `PATCH /api/v1/comments/:commentId`
Edit comment content.
- **Auth:** Required (Author only)
- **Response:** `200 OK`

#### `DELETE /api/v1/comments/:commentId`
Delete comment and cascade delete any child replies.
- **Auth:** Required (Author only)
- **Response:** `200 OK`

#### `POST /api/v1/posts/:postId/save` & `DELETE /api/v1/posts/:postId/save`
Save or unsave a post into user's private bookmarks.
- **Auth:** Required
- **Response:** `200 OK`

#### `GET /api/v1/users/me/saved-posts`
Retrieve authenticated user's saved posts with cursor pagination.
- **Auth:** Required
- **Response:** `200 OK` with cursor pagination.

---

### 3.3 Feed & Ranking

#### `GET /api/v1/feed/following`
Retrieve posts from accounts the user follows and self, in reverse chronological order.
- **Auth:** Required
- **Query Params:** `limit` (default 20), `cursor` (ID of last item)
- **Response:** `200 OK` `{ "items": [...], "nextCursor": "...", "hasMore": true }`

#### `GET /api/v1/feed/for-you`
Retrieve engagement-ranked feed (likes count * 2 + comments count * 3 - recency decay), filtering out blocked authors and private non-followed profiles.
- **Auth:** Optional (anonymous users view public posts only)
- **Query Params:** `limit`, `cursor`
- **Response:** `200 OK`

---

### 3.4 Messaging & Groups

#### `POST /api/v1/conversations`
Create or retrieve an existing 1-on-1 direct conversation idempotently.
- **Auth:** Required
- **Request Body:** `{ "recipientId": "<USER_ID>" }`
- **Response:** `201 Created` (or `200 OK` if conversation already existed)

#### `GET /api/v1/conversations`
List user's active conversations sorted by recent message activity, with unread counters and member profiles.
- **Auth:** Required
- **Response:** `200 OK`

#### `POST /api/v1/conversations/:conversationId/messages`
Send message in direct or group conversation. Dispatches realtime WebSocket event to members.
- **Auth:** Required (Member only)
- **Request Body:** `{ "content": "Hello!" }`
- **Response:** `201 Created`

#### `GET /api/v1/conversations/:conversationId/messages`
Retrieve cursor-paginated message history.
- **Auth:** Required (Member only)
- **Response:** `200 OK`

#### `POST /api/v1/conversations/:conversationId/read`
Mark conversation as read and reset unread message counter.
- **Auth:** Required (Member only)
- **Response:** `200 OK`

#### `POST /api/v1/groups`
Create a new group conversation with name, avatar, and initial members. The creator is granted the `ADMIN` role.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "name": "Design Team",
    "avatar": "https://...",
    "memberIds": ["user_1", "user_2"]
  }
  ```
- **Response:** `201 Created`

#### `GET|PATCH /api/v1/groups/:groupId`
Retrieve or update group details (name/avatar). Updates require `ADMIN` role.
- **Auth:** Required (Member for GET, Admin for PATCH)
- **Response:** `200 OK`

#### `POST /api/v1/groups/:groupId/members`
Add member to group. Requires `ADMIN` role.
- **Auth:** Required (Admin only)
- **Response:** `201 Created`

#### `DELETE /api/v1/groups/:groupId/members/:userId`
Remove member from group. Admins can remove any member; non-admins can only remove themselves (leave group).
- **Auth:** Required
- **Response:** `200 OK`

---

### 3.5 Notifications

#### `GET /api/v1/notifications`
Retrieve user's in-app notifications with cursor pagination.
- **Auth:** Required
- **Response:** `200 OK` with actor profiles and notification types (`POST_LIKE`, `POST_COMMENT`, `NEW_FOLLOWER`, `NEW_MESSAGE`).

#### `GET /api/v1/notifications/unread-count`
Get count of unread notifications.
- **Auth:** Required
- **Response:** `200 OK` `{ "unreadCount": 3 }`

#### `PATCH /api/v1/notifications/:notificationId/read`
Mark specific notification as read.
- **Auth:** Required (Recipient only)
- **Response:** `200 OK`

#### `PATCH /api/v1/notifications/read-all`
Mark all unread notifications as read.
- **Auth:** Required
- **Response:** `200 OK` `{ "markedCount": 3 }`

---

## 4. Realtime Socket Events

Managed via [`lib/socket-client.ts`](file:///c:/Users/Virag%20Jain/OneDrive/Desktop/POPPIN/lib/socket-client.ts) and [`lib/realtime/broadcast.ts`](file:///c:/Users/Virag%20Jain/OneDrive/Desktop/POPPIN/lib/realtime/broadcast.ts):

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `message:new` | Server -> Client | `MessageResponse` | Broadcast to conversation room on new message |
| `message:typing` | Client <-> Server | `{ conversationId, userId, isTyping }` | Typing indicators |
| `conversation:read` | Server -> Client | `{ conversationId, userId, readAt }` | Read receipt synchronization |
| `notification:new` | Server -> Client | `NotificationResponse` | Direct live in-app notification |

---

## 5. Verification Checklist

| Phase | Module | Tests Status | Typecheck | Lint |
| :--- | :--- | :--- | :--- | :--- |
| Phase 0 | Contracts & Models | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
| Phase 1 | Posts & Media CRUD | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
| Phase 2 | Engagement & 1-Level Replies | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
| Phase 3 | Feeds & Cursor Pagination | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
| Phase 4 | Messaging & Groups | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
| Phase 5 | Notifications | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
| Phase 6 | E2E Integration & Cascade | ✅ PASS | ✅ 0 errors | ✅ 0 errors |
