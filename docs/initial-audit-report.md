# POPPIN – Initial Security, Accessibility, Performance & Scalability Audit Report

**Audit Date:** November 5, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Application Security Engineer, DevOps Engineer, Database Architect & Accessibility Specialist  
**Target Codebase:** POPPIN Identity & User Management (Developer 1)  
**Baseline Status:** Phase 0 through Phase 6 implemented, all 37 API operations functional, baseline tests passing.

---

## 1. Executive Summary

A comprehensive architectural and defensive security review of the existing POPPIN application was conducted against **OWASP Top 10 (2021)**, **OWASP ASVS 4.0**, **WCAG 2.2 AA**, and production performance standards.

The existing code is well-structured, follows a clean separation of concerns (Repositories, Services, Route Handlers), uses Prisma ORM for parameterized queries, and enforces bcrypt hashing for passwords. However, several critical and high-priority areas require immediate hardening before the system can be considered production-ready:
1. **Security**: Missing Content Security Policy (CSP) and HTTP security headers; no origin-based CORS validation; lack of URL protocol validation allowing potential `javascript:` pseudo-protocol injection in profile links (Stored XSS); lack of session revocation when a user updates their password; absence of rate-limiting against credential stuffing and brute-force attacks; unvalidated OAuth `state` cookie.
2. **Database & Concurrency**: Missing indexes on critical foreign keys (`Follow.followingId`, `Block.blockedId`, `UserReport.reportedUserId`); potential unhandled Prisma constraint race conditions (`P2002`) returning 500 instead of 409 under simultaneous concurrent requests.
3. **Accessibility**: Homepage and base layout lacked semantic landmarks, skip-to-content links, sufficient color contrast, and proper focus rings for keyboard navigation.
4. **Performance & Scalability**: Next.js bundle lacks performance headers; stateless session token versioning is needed to support horizontal scaling without shared state bottlenecks.

---

## 2. Issues Identified by Severity

| ID | Issue Description | Affected Files | Severity | OWASP / Standard | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Stored XSS via Unrestricted URL Schemes**: External links and avatar URLs accept any URL format (including `javascript:`), enabling script execution on click. | `lib/validation/profile.ts` | **High** | OWASP A03:2021 (Injection) | Pending Fix |
| **SEC-02** | **No Session Revocation on Password Change**: Existing JWTs remain valid until expiration even after password reset or update. | `lib/auth/jwt.ts`, `lib/auth/middleware.ts`, `services/auth.service.ts` | **High** | OWASP A07:2021 (Auth Failures), ASVS 3.3.1 | Pending Fix |
| **SEC-03** | **Missing Rate Limiting**: Auth endpoints (`/login`, `/register`, `/forgot-password`) lack throttling, vulnerable to brute-force attacks. | Route handlers under `app/api/v1/auth/` | **High** | OWASP A07:2021, ASVS 2.2.1 | Pending Fix |
| **SEC-04** | **Missing HTTP Security Headers & CSP**: No Content-Security-Policy, HSTS, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. | `next.config.mjs` | **Medium** | OWASP A05:2021 (Misconfiguration) | Pending Fix |
| **SEC-05** | **Missing CORS Origin & Method Enforcement**: Cross-origin requests not strictly restricted to configured frontend origins. | `middleware.ts` | **Medium** | OWASP A01:2021 (Broken Access Control) | Pending Fix |
| **SEC-06** | **Unvalidated OAuth State Parameter**: Google OAuth flow does not store or verify state in an httpOnly cookie, enabling potential login CSRF. | `services/auth.service.ts`, `app/api/v1/auth/google/` | **Medium** | OWASP A01:2021, ASVS 3.8.3 | Pending Fix |
| **DB-01** | **Missing Database Indexes on Foreign Query Keys**: `Follow.followingId`, `Block.blockedId`, and `UserReport` fields lack indexes, causing sequential table scans. | `prisma/schema.prisma` | **Medium** | Performance / Scalability | Pending Fix |
| **DB-02** | **Raw Prisma Concurrency Errors**: Race conditions on simultaneous requests (duplicate follow/profile) throw Prisma `P2002` causing 500 error instead of 409. | `lib/http/response.ts` | **Medium** | Reliability / Concurrency | Pending Fix |
| **A11Y-01**| **WCAG 2.2 AA Violations on Base Views**: Missing skip-to-content link, missing semantic landmarks, insufficient contrast, missing focus-visible indicators. | `app/layout.tsx`, `app/page.tsx` | **Medium** | WCAG 2.2 AA (2.4.1, 2.4.7, 1.4.3) | Pending Fix |
| **PERF-01**| **Bundle & Connection Optimization**: Missing caching and asset prefetching configuration in Next.js config. | `next.config.mjs` | **Low** | Performance / Core Web Vitals | Pending Fix |

---

## 3. Planned Implementation Plan (Incremental Execution)

1. **Database & Concurrency Hardening**:
   - Update `prisma/schema.prisma` with `tokenVersion` on `User` and indexes on `Follow.followingId`, `Follow.followerId`, `Block.blockedId`, `Block.blockerId`, `UserReport.reportedUserId`, `PasswordResetToken.userId`.
   - Update `lib/http/response.ts` to map Prisma `P2002` to `409 Conflict` and `P2025` to `404 Not Found`.
2. **Security Hardening**:
   - Update `lib/validation/profile.ts` with strict `http:` / `https:` URL validation.
   - Implement `lib/http/rate-limit.ts` and apply to authentication endpoints.
   - Implement `tokenVersion` check in `lib/auth/middleware.ts` and token revocation in `AuthService`.
   - Configure security headers in `next.config.mjs`.
   - Implement Edge `middleware.ts` with CORS origin verification and preflight handling.
   - Implement OAuth state cookie verification.
3. **Accessibility (WCAG 2.2 AA) & UI Hardening**:
   - Update `app/layout.tsx` and `app/page.tsx` with skip link, landmarks, accessible interactive cards, ARIA roles, and high-contrast styles.
4. **Verification & Regression Testing**:
   - Write security, concurrency, and accessibility test suites in `tests/audit.test.ts`.
   - Run full test suite (`npm test`), TypeScript check (`tsc --noEmit`), and production build (`npm run build`).
5. **Final Production Readiness Report**:
   - Summarize fixes, test results, and production recommendations.

