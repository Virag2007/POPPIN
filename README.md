# POPPIN - Backend (Developer 1: Identity & User Management)

This repository contains the backend implementation for **Developer 1 (Identity & User Management)** for the POPPIN social platform, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**.

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
    "details": { ... } // optional validation details
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

## 3. Database & Migrations
- **ORM**: Prisma Client.
- **Database**: SQLite (`prisma/dev.db`) for lightweight, zero-dependency local development and testing; compatible with PostgreSQL.
- **Generate Client**: `npm run prisma:generate`
- **Push Schema**: `npm run prisma:push`
- **Migrate Dev**: `npm run prisma:migrate`

---

## 4. Environment Variables
See `.env.example` for details:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-key-at-least-32-chars-long"
JWT_EXPIRES_IN="7d"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/auth/google/callback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 5. Running & Testing
```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Run development server
npm run dev

# Run build
npm run build

# Run test suite
npm test
```

