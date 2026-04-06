# Code Review — `ayushmaan` Branch

> **Branch:** `origin/ayushmaan`
> **Review date:** 2026-04-06
> **Scope:** Changes introduced in this branch relative to the shared `copilot/understanding-repo-structure` base. Covers `backend/api-gateway` only — the frontend, mobile app, and service-folder READMEs are unchanged and out of scope.

---

## 1. Executive Summary

The `ayushmaan` branch delivers three concrete additions on top of the existing auth foundation:

| Area | What was added |
|---|---|
| **Access control** | A fully functional `AccessService` class and four live REST endpoints replacing the placeholder access route |
| **Auth extensions** | Forgot-password / reset-password endpoints and a token-refresh endpoint |
| **Admin provisioning** | `POST /admin/students` to create student accounts from an admin session |

The access control work is the most substantive contribution and is largely production-quality for a v0 scope. The auth extensions are functional but contain at least one dev-only data leak that must be removed before the branch is merged. The admin provisioning route has a minor role-check inconsistency versus the rest of the codebase.

**Overall branch quality: Good for the feature scope, with three issues that need resolution before merge.**

---

## 2. What Works Well

### 2.1 AccessService design is clean and well-structured

`backend/api-gateway/src/services/access-service.ts` follows a clear service/repository separation: the route validates the caller's role and payload shape, while the service owns all access-decision rules. The decision chain is explicit and readable:

1. Account must exist and be `ACTIVE`.
2. Geofence must exist and be `isActive`.
3. `STUDENT` role cannot use `PARKING`-type geofences.
4. If `credentialType === 'RFID'`, the submitted `credentialValue` must match the stored RFID tag.

Every denied attempt is written to the DB before the response is returned, which is the correct behavior — denied access events are evidence records and must always be persisted.

The escalation hint (`shouldEscalate`, `deniedCountWindow`) is a nice addition: it gives the calling layer a simple signal without embedding alert-delivery logic in the service.

### 2.2 Pagination is first-class

`listEvents` and `listOwnEvents` both respect `page`/`pageSize` query parameters, clamp `pageSize` to `MAX_PAGE_SIZE = 100`, and return `totalPages` in the envelope. This is ready for direct consumption by a frontend list view.

### 2.3 Schema tightening is correct

The `ayushmaan` branch promotes `action` and `reason` on `AccessEvent` from free-text `String` fields to proper Prisma enums (`AccessAction`, `AccessReason`). This eliminates a class of silent data-integrity bugs (e.g. `"DENIED"` vs `"denied"` vs `"Denied"`) and matches how the service code calls the values. The accompanying DB index additions on `(accountId, timestamp)`, `(geofenceId, timestamp)`, and `(action, timestamp)` are appropriate for the expected query patterns.

### 2.4 Self-scoped access history endpoint prevents IDOR

`GET /access/me/events` strips `accountId` from the query schema before it reaches `listOwnEvents`, which always injects `request.user.sub` as the account scope. This means an authenticated user cannot substitute another user's ID to read their access history through this endpoint. The implementation is correct.

### 2.5 Atomic device-switch and session expiry are preserved

`PrismaAuthStore.switchDevice` still wraps the old-session delete and new-session create in a `$transaction`, and `getActiveDeviceSessionByToken` now checks `expiresAt: { gt: new Date() }`. These invariants were present before the branch; the branch does not regress them.

---

## 3. Issues That Must Be Fixed Before Merge

### 3.1 🔴 Reset token returned in the API response (security leak)

**File:** `backend/api-gateway/src/plugins/auth.ts`, `POST /auth/password/forgot`

```ts
return reply.code(200).send({
  message: 'If an account exists for this identifier, a reset token has been generated.',
  resetToken, // DEV ONLY — remove before production
});
```

The `resetToken` is included in the HTTP response body. Even with the comment, this is a security vulnerability: any network observer, frontend logger, or intermediary proxy can capture the token and use it to reset any account's password without the user's knowledge.

**Fix:** Remove the `resetToken` field from the response body entirely. In a real deployment the token is delivered out-of-band (email). For local development, the `console.log` two lines above is sufficient.

---

### 3.2 🟠 `POST /admin/students` uses a local `jwtVerify` call instead of the shared `authenticate` decorator

**File:** `backend/api-gateway/src/routes/admin-students.ts`

```ts
fastify.post('/admin/students', async (request, reply) => {
  await request.jwtVerify();                        // <-- manual call
  const user = request.user as { sub: string; role?: string };
  if (!user?.role || user.role.toUpperCase() !== 'ADMIN') {
    throw new AppError('FORBIDDEN', 403, 'Admin access required');
  }
  ...
```

Every other protected route in this codebase uses `{ onRequest: [fastify.authenticate] }` as the route option, which provides consistent 401 handling and a typed `request.user`. The admin route bypasses this by calling `request.jwtVerify()` inline. The behavior is equivalent today, but it diverges from the codebase convention and makes the route harder to audit.

**Fix:** Change the route declaration to:

```ts
fastify.post(
  '/admin/students',
  { onRequest: [fastify.authenticate] },
  async (request, reply) => {
    // request.jwtVerify() call and the manual cast can be removed
    const user = request.user;
    if (user.role.toUpperCase() !== 'ADMIN') {
      throw new AppError('FORBIDDEN', 403, 'Admin access required');
    }
    ...
```

---

### 3.3 🟠 `POST /auth/password/forgot` leaks account existence in the error path

**File:** `backend/api-gateway/src/plugins/auth.ts`

The endpoint correctly returns a neutral message when the account does not exist or is not active. However, the same endpoint calls `store.setResetToken`, which `UPDATE`s the `accounts` table. If that update fails (e.g. row-level lock timeout), the catch falls through to `handleError`, which will return an internal-server-error — a response shape different from the neutral one — making the endpoint timing and response non-uniform across code paths.

**Fix:** Wrap the `setResetToken` call in its own try/catch and ensure a neutral `200` response is always returned for all non-exception cases. Log the error server-side rather than propagating it to the client.

---

## 4. Minor Issues / Suggestions

### 4.1 `AccessEvent` import is unused

**File:** `backend/api-gateway/src/services/access-service.ts`

```ts
import {
  AccessAction,
  AccessEvent,      // <-- never used as a type directly; AccessEventRecord covers it
  AccessReason,
  ...
} from '@prisma/client';
```

`AccessEvent` is imported but not referenced by name anywhere in the file. Remove it to keep the import list clean.

---

### 4.2 `PARKING` geofence restriction is a string literal comparison

**File:** `backend/api-gateway/src/services/access-service.ts`

```ts
if (!finalReason && geofence.type === 'PARKING' && account.role === 'STUDENT') {
```

`geofence.type` is stored as a free-text `String` in the schema. If a seed row or admin UI creates a geofence with type `"parking"` or `"Parking"`, this check silently passes. Consider either:
- Promoting `GeofenceType` to a Prisma enum in the schema (consistent with what was done for `AccessAction`/`AccessReason`), or
- Normalising with `.toUpperCase()` in the comparison as a short-term guard.

---

### 4.3 Stale commented-out code in `auth.ts` plugin

**File:** `backend/api-gateway/src/plugins/auth.ts`

The top ~100 lines of the file are the old mock-backed plugin, fully commented out. There is also a second commented-out version of the refresh route near the bottom. Dead code at this scale makes the file harder to navigate and review.

**Fix:** Remove all commented-out code blocks. Git history preserves the old implementation if it is ever needed.

---

### 4.4 `createStudentAccount` has `Promise<any>` return type

**File:** `backend/api-gateway/src/stores/prisma-auth-store.ts`

```ts
async createStudentAccount(input: CreateStudentAccountInput): Promise<any> {
```

A `CreateStudentAccountResult` type (matching the shape returned by the method) would prevent silent shape mismatches if the method is refactored. The `CreateStudentResponseSchema` type already exists in `schemas/auth.ts` and could be reused.

---

### 4.5 `hasActiveDeviceSession` is not used by any callers shown

**File:** `backend/api-gateway/src/stores/prisma-auth-store.ts`

`hasActiveDeviceSession` returns a `boolean`. The only caller visible in the branch is `auth-service.ts`, which calls `getActiveDeviceSession` (the object-returning variant) and then checks for `null`. The boolean variant appears to be leftover. Verify whether it is still needed; if not, remove it.

---

## 5. Completeness Assessment (Branch Scope Only)

| Capability | Status after this branch |
|---|---|
| Account activation / login / logout / device switch | ✅ Complete (unchanged) |
| Token refresh | ✅ Implemented |
| Forgot password / reset password | ✅ Implemented (pending fix 3.1) |
| Admin-only student creation | ✅ Implemented (pending fix 3.2) |
| Access event history (self) | ✅ Implemented |
| Access event history (admin/security search) | ✅ Implemented |
| Access check / decision / RFID validation | ✅ Implemented |
| Escalation hint on repeated denials | ✅ Implemented |
| Attendance routes | ⏳ Still stubbed — out of scope for this branch |
| Presence routes | ⏳ Still stubbed — out of scope for this branch |
| Incident routes | ⏳ Still stubbed — out of scope for this branch |
| Frontend wiring to new endpoints | ⏳ Not done — out of scope for this branch |

---

## 6. Files Changed (Summary)

| File | Nature of change |
|---|---|
| `prisma/schema.prisma` | Added `AccessAction`, `AccessReason` enums; geofence FK on `AccessEvent`; DB indexes; `resetToken` fields on `Account` |
| `prisma/seed.ts` | Updated seed to use enums; added denied-access scenarios |
| `src/app.ts` | Registered `adminStudentsRoute` |
| `src/plugins/auth.ts` | Added forgot-password, reset-password, refresh endpoints; removed mock store; large commented-out block present |
| `src/routes/access.ts` | Replaced placeholder with four real endpoints backed by `AccessService` |
| `src/routes/admin-students.ts` | New file — `POST /admin/students` |
| `src/routes/students.ts` | Simplified to profile-fetch only (`/students/me` and `/students/:studentId/profile`) |
| `src/schemas/auth.ts` | Added `CreateStudentRequestSchema`, `ForgotPasswordRequestSchema`, `ResetPasswordRequestSchema`, `RefreshRequestSchema` and response types |
| `src/services/access-service.ts` | New file — full `AccessService` class |
| `src/stores/prisma-auth-store.ts` | Added `createStudentAccount`, `getProfileById`, reset-token methods |

---

## 7. Summary of Required Actions

| Priority | Action |
|---|---|
| 🔴 Must fix | Remove `resetToken` from `POST /auth/password/forgot` response body |
| 🟠 Should fix | Align `POST /admin/students` to use the shared `authenticate` decorator |
| 🟠 Should fix | Harden the forgot-password flow to always return a neutral response regardless of internal errors |
| 🟡 Nice to have | Remove unused `AccessEvent` import in `access-service.ts` |
| 🟡 Nice to have | Promote `geofence.type` to a Prisma enum or add case-insensitive comparison |
| 🟡 Nice to have | Delete the large commented-out block in `auth.ts` |
| 🟡 Nice to have | Type the return value of `createStudentAccount` instead of `Promise<any>` |
