# POPPIN – Backend Final Audit, Security Hardening & Production-Readiness Assessment

**Document Date:** November 6, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Application Security Engineer, DevOps Engineer & Database Architect  
**Domain Scope:** POPPIN Identity, Authentication & User Management (Developer 1)  
**Stack:** Next.js 15 (App Router), TypeScript, Prisma ORM 5.22, SQLite (Dev) / PostgreSQL (Target Prod), Tailwind CSS  

---

## 1. Executive Summary & Verification Status

This audit evaluates the actual implemented capabilities and current limitations of the POPPIN Identity & User Management backend. Claims are calibrated strictly against verifiable automated tests, static analysis, and code inspections.

### Status Taxonomy
- **PASS**: Implemented, verified with automated tests, and functionally complete.
- **PARTIAL**: Implemented in code, but subject to operational limitations, single-node boundaries, or requiring third-party infrastructure.
- **MISSING**: Feature required for full production operation that is not yet implemented.
- **NOT VERIFIED**: Code or design implemented, but formal external certification (e.g. third-party penetration test, multi-threaded load test, independent screen-reader audit) has not been performed.

| Category / Requirement | Status | Summary of Evidence & Verification |
| :--- | :---: | :--- |
| **Authentication & Session Security** | **PASS** | Bcrypt password hashing with 72-byte UTF-8 validation, stateless JWT with explicit `HS256` pinning, session revocation via database `tokenVersion`, and timing/enumeration defenses. |
| **OWASP ASVS / Web Security** | **PASS** | Strict URL scheme validation (`http:`, `https:`), CSRF origin/referer checks for cookie auth, OAuth state cookie verification, rate limiting, and HTTP security headers (CSP, X-Frame-Options: DENY, nosniff). |
| **Backend-Enforced Privacy & Authorization** | **PASS** | Sensitive profile fields (`bio`, `skills`, `links`, etc.) shielded from anonymous and non-follower viewers. Bidirectional block prevents profile and follower access. |
| **Database Architecture & Indexing** | **PASS** | Composite and foreign-key indexes added to schema and verified directly in SQLite `sqlite_master`. Prisma `P2002` concurrency conflicts handled as 409 Conflict. |
| **Password Reset Token Protection** | **PARTIAL** | Token generation, expiration (1 hr), single-use invalidation, and session revocation work. Token exposure is disabled in `NODE_ENV === "production"`. Outbound email delivery is **MISSING**. |
| **Horizontal Scalability & Load Handling** | **PARTIAL** | Architecture is stateless, but current rate limiter is in-memory (per-process) and development DB is SQLite. Multi-node distributed deployment requires Redis and PostgreSQL. Load capacity is **NOT VERIFIED**. |
| **Production Dependency Security** | **PASS** | `npm audit --omit=dev` confirms **0 vulnerabilities** in production runtime dependencies. |
| **Development Dependency Tooling** | **PARTIAL** | 6 moderate severity vulnerabilities in `@typescript-eslint/typescript-estree -> minimatch` locked by upstream `eslint-config-next`. Safe from production runtime. |
| **Accessibility Compliance (WCAG 2.2)** | **NOT VERIFIED** | Semantic landmarks, skip-link, 44x44px touch targets, and contrast ratios (>= 7.6:1) implemented, but third-party assistive technology audit is **NOT VERIFIED**. |

---

## 2. Password Security Audit

### 2.1 Bcrypt 72-Byte Boundary & Unicode Handling
- **Bcrypt Specification**: Bcrypt processes passwords up to a hard maximum of 72 bytes. Any byte beyond 72 is silently ignored by the algorithm.
- **Vulnerability Addressed**: In JavaScript, `string.length` measures UTF-16 code units, not UTF-8 bytes. Multi-byte Unicode characters (such as emojis taking 4 bytes or CJK characters taking 3 bytes) can easily exceed 72 bytes while appearing well below a 72-character threshold (e.g. 20 emojis = 80 bytes).
- **Implementation**:
  In `lib/validation/auth.ts`:
  ```typescript
  const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password cannot exceed 72 characters")
    .refine(
      (pwd) => Buffer.byteLength(pwd, "utf8") <= 72,
      "Password cannot exceed 72 bytes in UTF-8 encoding (bcrypt limitation)"
    );
  ```
- **Login Compatibility**:
  To avoid breaking legacy accounts that may have registered with passwords exceeding 72 bytes or characters prior to the constraint, `loginSchema` does not reject strings at 72 characters. Instead, it enforces a 1024-character upper bound:
  ```typescript
  export const loginSchema = z.object({
    email: z.string().email().max(255).toLowerCase().trim(),
    password: z.string().min(1, "Password is required").max(1024, "Password cannot exceed 1024 characters"),
  });
  ```
  This prevents payload memory exhaustion while allowing bcrypt's native comparison to handle credential verification without premature validation errors.

---

## 3. Privacy, Authorization & Safety Enforcement

Privacy and blocking rules are enforced at the backend database and service layer, ensuring unauthenticated or unauthorized clients cannot bypass restrictions by querying API endpoints directly.

### 3.1 Profile View Access Matrix
When `privacySettings.isPrivate === true`:
- **Anonymous Viewer (Unauthenticated)**:
  - Allowed: Basic public handle (`username`, `displayName`, `avatar`, `followersCount`, `followingCount`, `isPrivate: true`).
  - Shielded (`null` or `[]`): `bio`, `location`, `coverImage`, `skills`, `interests`, `links`, `education`, `experience`.
- **Non-Follower Viewer (Authenticated)**:
  - Allowed: Basic public handle metadata.
  - Shielded: All personal and professional sub-collections.
- **Confirmed Follower (Authenticated & Follows User)**:
  - Allowed: Full profile, including `bio`, `location`, `coverImage`, and all sub-collections.
- **Profile Owner (Self)**:
  - Allowed: Full profile access and editing permissions.

### 3.2 Follower & Following Lists Access Matrix
- **Public Account**: Anyone can query followers and following lists.
- **Private Account**:
  - Non-follower or anonymous: Returns `403 Forbidden` (`code: "PRIVATE_ACCOUNT"`).
  - Confirmed follower or account owner: Returns `200 OK` with paginated follower/following entries.

### 3.3 Bidirectional Blocking
Block enforcement operates symmetrically via `ConnectionRepository.isBlockedOrBlocking(viewerId, targetUserId)`:
1. **Target Blocked Viewer**: If Alice blocked Bob, Bob querying Alice's profile receives `404 Not Found` (preventing presence enumeration) and `403 Forbidden` on connection endpoints.
2. **Viewer Blocked Target**: If Bob blocked Alice, Bob querying Alice's profile also receives `404 Not Found`.
3. **Follower Invalidation**: Creating a block automatically severs all existing follow relationships in both directions in a single transaction.

---

## 4. Database Architecture & Index Verification

### 4.1 Schema Additions (`prisma/schema.prisma`)
The following indexes and columns were added to support high-throughput lookup performance and immediate token invalidation:

1. **User Token Version**:
   - `User.tokenVersion Int @default(1)`: Incremented during password changes to invalidate all issued JWTs.
2. **Follow Lookups**:
   - `@@index([followingId])`: Accelerates counting followers and retrieving follower lists (`where: { followingId: userId }`).
   - `@@index([followerId])`: Accelerates counting following and retrieving following lists (`where: { followerId: userId }`).
3. **Block Lookups**:
   - `@@index([blockedId])`: Accelerates check if a user is blocked (`where: { blockedId: userId }`).
   - `@@index([blockerId])`: Accelerates querying a user's blocked list (`where: { blockerId: userId }`).
4. **Password Reset Lookups**:
   - `@@index([userId])`: Accelerates user reset history queries.
5. **User Report Lookups**:
   - `@@index([reportedUserId])`: Accelerates abuse moderation queries.
   - `@@index([reporterId])`: Accelerates reporter history lookups.

### 4.2 Physical Database Index Verification
The presence of these indexes in the local SQLite database (`prisma/dev.db`) was confirmed by inspecting `sqlite_master`:
```text
Table: Follow             | Index: Follow_followingId_idx          | CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId")
Table: Follow             | Index: Follow_followerId_idx           | CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId")
Table: Block              | Index: Block_blockedId_idx             | CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId")
Table: Block              | Index: Block_blockerId_idx             | CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId")
Table: PasswordResetToken | Index: PasswordResetToken_userId_idx   | CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")
Table: UserReport         | Index: UserReport_reportedUserId_idx   | CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId")
Table: UserReport         | Index: UserReport_reporterId_idx       | CREATE INDEX "UserReport_reporterId_idx" ON "UserReport"("reporterId")
```

### 4.3 Database Synchronization & Migration Plan
- **Current State**: The development database was synchronized using `npx prisma db push`.
- **Production Requirement**: For production environments, direct schema pushes should **not** be used. Instead, standard Prisma migrations should be tracked:
  ```bash
  npx prisma migrate dev --name init_production_schema
  npx prisma migrate deploy
  ```

---

## 5. Scalability, Concurrency & Infrastructure Boundaries

### 5.1 Tested vs. Untested Capabilities
- **Tested & Verified**:
  - Prisma `P2002` concurrency conflict mapping to structured `409 Conflict`.
  - In-memory sliding-window rate limiting within a single Node.js process.
  - Foreign key indexing on relationship tables.
  - Unit and integration tests passing within single-process execution.
- **Untested Claims (Caution)**:
  - Multi-instance concurrency, distributed race conditions, and sustained load of thousands of concurrent users have **NOT** been verified with automated load-testing harnesses (e.g. k6, Artillery).

### 5.2 SQLite Concurrency Limitations
- SQLite utilizes file-level locking for transactions (`WAL` mode or standard rollbacks). Concurrent write transactions will fail with `SQLITE_BUSY` when connection concurrency spikes.
- SQLite is strictly suitable for local development, automated testing, and low-traffic staging. It is **unsuitable** for production multi-user social networking.

### 5.3 PostgreSQL & Distributed Rate-Limiting Migration Plan
To achieve production horizontal scalability:
1. **Database Provider Migration**:
   - In `prisma/schema.prisma`, switch `provider = "sqlite"` to `provider = "postgresql"`.
   - Update `DATABASE_URL` in production `.env` to connect to a pooled PostgreSQL instance (e.g. AWS RDS, Neon, Supabase, or PgBouncer).
2. **JSON Storage Normalization**:
   - SQLite uses `String @default("[]")` for skills, links, education, and experience.
   - On PostgreSQL, these can be migrated to native `Json` columns or normalized into relational child tables.
3. **Shared Distributed Rate Limiting**:
   - The current `lib/http/rate-limit.ts` uses an in-memory `Map` with an automatic 60-second cleanup sweep.
   - In a multi-instance containerized environment (e.g. Vercel, ECS, Kubernetes), each instance maintains independent memory, allowing users to exceed rate limits across different pods.
   - **Migration**: Replace the in-memory store in `lib/http/rate-limit.ts` with a Redis adapter (e.g. `@upstash/ratelimit` or `ioredis`) using Redis sliding-window commands (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`).

---

## 6. Password Reset Security & Session Invalidation

### 6.1 Cryptographic Reset Token Hashing at Rest
- **Mechanism**: In `services/auth.service.ts`, generated reset tokens (`crypto.randomBytes(32).toString("hex")`) are hashed with **SHA-256** prior to database storage (`UserRepository.createPasswordResetToken`).
- **Defense**: Even if the database is read or compromised, an attacker cannot retrieve or use raw password reset tokens. The endpoint hashes incoming client tokens on lookup.

### 6.2 Atomic Concurrency & Single-Use Protection
- **Mechanism**: In `UserRepository.consumePasswordResetToken`, token validation and consumption are executed within an interactive database transaction (`prisma.$transaction`).
- **Concurrency Defense**: If two concurrent requests attempt to consume the same reset token simultaneously, the transaction serializes execution. Exactly one request succeeds (200), and all subsequent concurrent requests fail with `400 INVALID_RESET_TOKEN`.

### 6.3 Anti-Enumeration Uniformity
- In `AuthService.forgotPassword`, requests for existing and non-existent email addresses return the **exact same HTTP 200 response** and identical user message: `"If an account exists with this email, password reset instructions have been generated."`.
- No sensitive account information or existence indicators are leaked.

### 6.4 Session Invalidation on Logout
- In `app/api/v1/auth/logout/route.ts`, when an authenticated user logs out, `UserRepository.revokeSessions(user.id)` increments `user.tokenVersion` in the database.
- Any subsequent attempt to use that previously issued token (Bearer or cookie) triggers a `401 Unauthorized` (`code: "SESSION_REVOKED"`).

### 6.5 Production Reset Token Non-Exposure & Missing Mailer Integration
- In `services/auth.service.ts`:
  ```typescript
  static async forgotPassword(email: string) {
    const isProduction = process.env.NODE_ENV === "production";
    // ... token generated and stored as SHA-256 in DB ...
    return {
      message: "If an account exists with this email, password reset instructions have been generated.",
      ...(isProduction ? {} : { resetToken: rawToken }),
    };
  }
  ```
- **Verification**: In automated test 9, when `NODE_ENV === "production"`, `resetToken` is completely omitted from the JSON response (`undefined`).
- **Production Requirement (MISSING)**: In production, an outbound mailer service (e.g. Resend, SendGrid, Mailgun, or AWS SES) must be integrated into `AuthService.forgotPassword`. The endpoint must send an email containing a link with the reset token (`https://app.poppin.io/reset-password?token=...`) rather than relying on API payload inspection.


---

## 7. Dependency Security & Audit Analysis

### 7.1 Production Runtime Dependencies (`npm audit --omit=dev`)
- Result: **0 vulnerabilities** (`found 0 vulnerabilities`).
- Runtime packages: `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `next`, `react`, `react-dom`, `zod`.
- Status: **PASS**.

### 7.2 Development Tooling Dependencies (`npm audit`)
- Result: 6 moderate severity vulnerabilities in `@typescript-eslint/typescript-estree -> minimatch` (GHSA-g3hv-75wg-m249: glob amplification DoS).
- **Investigation**:
  - The vulnerable `minimatch` dependency is deeply nested under `@typescript-eslint/parser` and `eslint-config-next@15.5.29`.
  - Upstream peer dependencies of ESLint 9 strictly lock this sub-dependency. Running `npm audit fix` introduces peer dependency conflicts (`ERESOLVE overriding peer dependency`) without resolving the warning.
  - Because `@typescript-eslint` is purely a build-time linter tool and is never bundled into the production JavaScript artifact, this issue does not pose a runtime vulnerability.
- Status: **PARTIAL** (Documented and accepted dev-tooling risk).

---

## 8. Accessibility Audit (WCAG Assessment)

### 8.1 Status: PARTIAL / NOT VERIFIED
Automated code structure adheres to WCAG 2.2 recommendations, but external screen-reader testing and third-party accessibility certification have **NOT** been performed.

### 8.2 Verified Code Additions
- **Bypass Blocks**: Visible "Skip to main content" link added as first child in `app/layout.tsx`.
- **HTML5 Landmarks**: Structured with `<header role="banner">`, `<main id="main-content" role="main">`, and `<footer role="contentinfo">`.
- **Target Size**: Navigation and action links enforce `min-h-[44px] min-w-[44px]`.
- **Color Contrast**: Text colors (`slate-900` on white, `slate-600` on white) provide contrast ratios exceeding 7.6:1 (exceeds WCAG AA 4.5:1 requirement).
- **Focus Rings**: Interactive elements feature `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`.

---

## 9. Final Verification Matrix

| Verification Check | Tool / Runner | Result |
| :--- | :--- | :---: |
| **Full Automated Test Suite (7 Suites)** | `npx tsx tests/run-all.ts` | **89 / 89 Tests Passed** (0 failures) |
| **Static Type Checking** | `npx tsc --noEmit` | **0 Errors** (Clean exit code 0) |
| **Linter Code Quality** | `next lint` | **0 Errors / 0 Warnings** |
| **Production Build Compilation** | `next build` | **0 Errors** (All 30 routes + Edge middleware compiled) |
| **Production Dependency Audit** | `npm audit --omit=dev` | **0 Vulnerabilities** |

---

## 10. Developer 2 Integration Contracts

All API contracts, event payloads (e.g. `NEW_FOLLOWER`), and shared schema interfaces between Developer 1 (Identity & User Management) and Developer 2 (Posts, Feed & Messaging) are formally documented in [`docs/developer-2-integration.md`](./developer-2-integration.md).

