# POPPIN - Backend (Developer 1: Identity & User Management)

This repository contains the complete backend implementation for **Developer 1 (Identity & User Management)** for the POPPIN social platform, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**.

---

## 1. Scope & Ownership
- **Authentication & Authorization**: Email/password registration and login; Google OAuth; JWT handling; bcrypt hashing; forgot & reset password; auth middleware & ownership checks.
- **User Profile**: Profiles, unique @username & live availability check, avatar/cover/headline/bio/location, skills, interests, external links, education & experience records, public profiles, follower/following counts.
- **Onboarding**: Three-step onboarding data flow, role & headline, skills & interests, follow suggestions, completion status.
- **Connections**: Follow/unfollow, followers/following lists, accurate counts, suggested people, validation against invalid/duplicate relationships.
- **Account Settings & Safety**: Account details, privacy settings, account deletion, block/unblock, user reporting.

---

## 2. Shared API Conventions (Agreed with Developer 2)

### Base Path
All API endpoints are prefixed with `/api/v1`.

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description",
    "details": { ... }
  }
}
```

### HTTP Status Codes
- `200 OK`: Successful retrieval or update.
- `201 Created`: Successful resource creation (register, follow, report, etc.).
- `400 Bad Request`: Validation failure or invalid input parameters.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient permissions or ownership check failure (e.g. attempting to edit someone else's profile or interacting with a blocked user).
- `404 Not Found`: Resource or user not found.
- `409 Conflict`: Conflict or duplicate record (e.g. duplicate email, taken username, already following).
- `500 Internal Server Error`: Unhandled server exception.

---

## 3. Consolidated Endpoint Checklist
All assigned endpoints match the agreed contract and are implemented under `app/api/v1/`:

| Method | Route | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register with email/password | Public |
| `POST` | `/api/v1/auth/login` | Login with email/password | Public |
| `GET` | `/api/v1/auth/google` | Start Google OAuth | Public |
| `GET` | `/api/v1/auth/google/callback` | Handle Google OAuth callback | Public |
| `POST` | `/api/v1/auth/forgot-password` | Start password recovery | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token | Public |
| `POST` | `/api/v1/auth/logout` | End session & clear cookie | Public |
| `GET` | `/api/v1/auth/me` | Get authenticated user identity | Protected |
| `POST` | `/api/v1/users/me/profile` | Create own profile | Protected |
| `GET` | `/api/v1/users/me/profile` | Get own profile | Protected |
| `PATCH` | `/api/v1/users/me/profile` | Edit own profile details | Protected |
| `GET` | `/api/v1/usernames/availability?username={username}` | Check username availability | Public |
| `GET` | `/api/v1/profiles/{username}` | Get public profile and counts | Public |
| `PUT` | `/api/v1/users/me/profile/skills` | Manage skills list | Protected |
| `PUT` | `/api/v1/users/me/profile/interests` | Manage interests list | Protected |
| `PUT` | `/api/v1/users/me/profile/links` | Manage external links | Protected |
| `PUT` | `/api/v1/users/me/profile/education` | Manage education records | Protected |
| `PUT` | `/api/v1/users/me/profile/experience` | Manage experience records | Protected |
| `GET` | `/api/v1/onboarding` | Get onboarding progress | Protected |
| `PUT` | `/api/v1/onboarding/step-1` | Save role and headline | Protected |
| `PUT` | `/api/v1/onboarding/step-2` | Save skills and interests | Protected |
| `GET` | `/api/v1/onboarding/follow-suggestions` | Get onboarding follow suggestions | Protected |
| `POST` | `/api/v1/onboarding/complete` | Mark onboarding complete | Protected |
| `POST` | `/api/v1/users/{userId}/follow` | Follow user | Protected |
| `DELETE` | `/api/v1/users/{userId}/follow` | Unfollow user | Protected |
| `GET` | `/api/v1/users/{userId}/followers` | Get user's followers | Public |
| `GET` | `/api/v1/users/{userId}/following` | Get user's following list | Public |
| `GET` | `/api/v1/users/me/followers` | Get own followers | Protected |
| `GET` | `/api/v1/users/me/following` | Get own following list | Protected |
| `GET` | `/api/v1/users/suggestions` | Get suggested people | Protected |
| `GET` | `/api/v1/users/me/account` | Get account details | Protected |
| `PATCH` | `/api/v1/users/me/account` | Update account details (email) | Protected |
| `GET` | `/api/v1/users/me/privacy` | Get privacy settings | Protected |
| `PATCH` | `/api/v1/users/me/privacy` | Update privacy settings | Protected |
| `DELETE` | `/api/v1/users/me` | Delete own account (Cascade) | Protected |
| `POST` | `/api/v1/users/{userId}/block` | Block user | Protected |
| `DELETE` | `/api/v1/users/{userId}/block` | Unblock user | Protected |
| `POST` | `/api/v1/users/{userId}/report` | Report user | Protected |

---

## 4. Developer 2 Integration Contracts
See [`docs/developer-2-integration.md`](./docs/developer-2-integration.md) for full contracts regarding:
- Follow events for the Notification module (`NEW_FOLLOWER`)
- Follower queries for the Following Feed
- Block & privacy visibility restrictions for posts and messaging

---

## 5. API Documentation & Postman Collection
Import [`docs/poppin-api-collection.json`](./docs/poppin-api-collection.json) into Postman or Insomnia. It includes:
- All 37 endpoint requests organized by module
- Sample request bodies and query parameters
- `{{baseUrl}}` and `{{authToken}}` environment variables

---

## 6. Running & Testing
```bash
# Push database schema
npx prisma db push

# Run Next.js development server
npm run dev

# Run full test suite (Phases 1-5 + E2E integration)
npm test

# Run Next.js production build
npm run build
```
