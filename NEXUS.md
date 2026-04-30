# NEXUS — Unified Campus Intelligence Platform

> **Last audited:** 2026-04-30  
> **Overall completion estimate:** ~47%  
> This document is the single source of truth for the project. It supersedes all previous README, audit, progress, handoff, and installation documents.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Current Functionality Audit](#5-current-functionality-audit)
6. [Security Audit](#6-security-audit)
7. [API Reference](#7-api-reference)
8. [Database Schema](#8-database-schema)
9. [Installation & Local Setup](#9-installation--local-setup)
10. [Demo Runbook](#10-demo-runbook)
11. [Service Boundaries (Planned Microservices)](#11-service-boundaries-planned-microservices)
12. [Historical Progress Summary](#12-historical-progress-summary)
13. [Recommended Next Steps](#13-recommended-next-steps)

---

## 1. Project Overview

NEXUS is a full-stack unified campus intelligence platform that consolidates attendance tracking, access control, and security monitoring into a single system. It replaces manual roll calls and siloed campus systems with real-time presence signals, structured audit trails, and a security dashboard.

### Core Value Propositions

- **Attendance**: Students mark attendance via mobile app with QR + geofence validation; no manual roll calls.
- **Access Verification**: A single credential (student ID + phone device) gates campus entry and parking.
- **Security Monitoring**: Real-time presence tracking, loitering detection, anomaly alerts for administrators and security staff.
- **Offline Resilience**: DOLN (Delay-Optimized Local Network) enables offline presence logging with later sync.

### Key Design Principles

1. **Admin-provisioned only** — No public self-signup; all accounts created by campus administrators.
2. **One active device per student** — Prevents credential sharing; simplifies location tracking.
3. **Device binding with switching** — Students can migrate to a new device, but not use two simultaneously.
4. **Structured error codes** — All failures return semantic codes (e.g., `DEVICE_ALREADY_BOUND`) for clean client handling.
5. **Modular architecture** — Clear service boundaries planned for independent scaling.

---

## 2. Architecture

```
Browser / Mobile App
        │
        ▼
[React Frontend] ←→ [API Gateway :3000] (Fastify + TypeScript)
                            │
                     ┌──────┴───────┐
                     │  Plugins     │  JWT Auth, CORS
                     │  Routes      │  /auth, /students, /attendance,
                     │              │  /access, /presence, /incidents,
                     │              │  /admin/students, /dev/demo/reset
                     │  Services    │  Business logic (Auth, Attendance,
                     │              │  Access, Presence)
                     │  Stores      │  Prisma-backed (prisma-auth-store,
                     │              │  prisma-presence-store)
                     └──────┬───────┘
                            │
                      [PostgreSQL 15]
                      (via Docker + Prisma ORM)

Planned (not yet built):
  ├── identity-service      (extract from api-gateway)
  ├── campus-service        (geofences, topology)
  ├── schedule-attendance-service
  ├── presence-service      (standalone)
  ├── access-service        (standalone)
  ├── reliability-service   (ML scoring)
  ├── incident-service      (alerts, lifecycle)
  └── realtime              (WebSocket push)
```

The current architecture is a **monolithic API gateway** backed by a single PostgreSQL database. The `backend/services/` and other sub-folders are architecture stubs only — no code beyond README planning documents exists there.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Backend API | Fastify (Node.js), TypeScript |
| Auth | `@fastify/jwt` (HS256 JWT), bcrypt (password hashing) |
| Database | PostgreSQL 15 via Docker Compose, Prisma ORM |
| Validation | Zod |
| Frontend | React 18, Vite, TypeScript |
| UI Components | Radix UI + shadcn/ui, Tailwind CSS |
| State / Data | TanStack Query, React Hook Form |
| Charts | Recharts |
| Routing | React Router v6 |
| Testing | Vitest (unit), Playwright (E2E) |
| Monorepo | npm workspaces (`@nexus/core`, `@nexus/api-gateway`) |
| Containerization | Docker Compose (database only) |

---

## 4. Repository Structure

```
nexus/
├── backend/
│   ├── api-gateway/              # Main HTTP API server (Fastify, TypeScript)
│   │   ├── src/
│   │   │   ├── app.ts            # Fastify app factory (CORS, JWT, routes)
│   │   │   ├── server.ts         # Entry point
│   │   │   ├── routes/           # REST endpoint handlers
│   │   │   │   ├── access.ts
│   │   │   │   ├── admin-students.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── deprecated auth.ts  ← dead code, should be deleted
│   │   │   │   ├── dev-reset.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── incidents.ts
│   │   │   │   ├── presence.ts
│   │   │   │   └── students.ts
│   │   │   ├── plugins/
│   │   │   │   └── auth.ts       # Auth routes (activate, login, logout, refresh, etc.)
│   │   │   ├── services/
│   │   │   │   ├── access-service.ts
│   │   │   │   ├── attendance-service.ts
│   │   │   │   ├── auth-service.ts
│   │   │   │   └── presence/
│   │   │   │       ├── controller.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── model.ts
│   │   │   │       ├── routes.ts
│   │   │   │       ├── service.ts
│   │   │   │       └── utils.ts
│   │   │   ├── stores/
│   │   │   │   ├── prisma-auth-store.ts
│   │   │   │   └── prisma-presence-store.ts
│   │   │   ├── schemas/auth.ts   # Zod validation schemas
│   │   │   ├── types/            # TypeScript type extensions
│   │   │   ├── lib/prisma.ts     # Singleton Prisma client
│   │   │   └── dev/demo-reset.ts # Seed helper for demo resets
│   │   └── prisma/
│   │       ├── schema.prisma     # Full data model
│   │       ├── seed.ts           # Dev seed data
│   │       └── migrations/       # Migration history (6 migrations)
│   ├── core/                     # Shared utilities (npm workspace @nexus/core)
│   │   └── src/
│   │       ├── config.ts
│   │       ├── logger.ts
│   │       └── types/
│   ├── services/                 # Future microservices — README stubs only
│   │   ├── access-service/
│   │   ├── campus-service/
│   │   ├── identity-service/
│   │   ├── incident-service/
│   │   ├── presence-service/
│   │   ├── reliability-service/
│   │   └── schedule-attendance-service/
│   ├── ml-services/              # Placeholder — README only
│   ├── ingestion/                # Placeholder — README only
│   ├── realtime/                 # Placeholder — README only
│   └── scripts/                 # Placeholder — README only
├── frontend/
│   ├── web-dashboard/
│   │   └── campus-guardian-dashboard-main/
│   │       └── src/
│   │           ├── App.tsx         # Routes, role-based navigation
│   │           ├── pages/          # Student & Admin views + Auth pages
│   │           ├── components/     # Shared UI components + layout
│   │           ├── contexts/       # AuthContext (localStorage persistence)
│   │           ├── services/       # apiClient, authApi, dataApi
│   │           ├── mocks/          # Mock data (used when USE_MOCK* flags = true)
│   │           ├── hooks/
│   │           └── types/index.ts  # Shared types including UserRole
│   ├── mobile-app/               # Placeholder — README only
│   └── shared/                   # Placeholder — README only
├── docker-compose.yml            # PostgreSQL 15 container
├── package.json                  # Root npm workspaces config
└── tsconfig.base.json            # Shared TypeScript config
```

---

## 5. Current Functionality Audit

> Audited against actual source code as of 2026-04-30.

### 5.1 Feature Completion Matrix

| Feature Area | Expected Capability | Status | Completion | Key Files |
|---|---|---|---|---|
| **Auth — Core Flows** | Activate, login, logout, refresh, device switch, forgot/reset password | ✅ Implemented | ~85% | `plugins/auth.ts`, `services/auth-service.ts`, `stores/prisma-auth-store.ts` |
| **Auth — Security** | JWT protection on all mutating endpoints | ⚠️ Partial | ~60% | `plugins/auth.ts` — logout & device-switch still lack `onRequest: [authenticate]` |
| **Identity / Profiles** | Student profile storage, self-fetch, privileged lookup | ✅ Implemented | ~75% | `routes/students.ts`, `stores/prisma-auth-store.ts` |
| **Admin — Student Mgmt** | Create students, list students, activation provisioning | ⚠️ Partial | ~35% | `routes/admin-students.ts` — create + list only; no edit/suspend/bulk/resend |
| **Attendance** | QR + geofence validation, time-window PRESENT/LATE, faculty manual mark, enrollment check, session summary | ✅ Implemented | ~65% | `services/attendance-service.ts`, `routes/attendance.ts` |
| **Timetable / Schedule** | Course, Section, Group, ClassSessionTemplate, Faculty assignment | ✅ Schema + Seed | ~55% | `prisma/schema.prisma`, no API surface for timetable management yet |
| **Access Control** | Gate entry/exit decisions, RFID validation, deny logging, escalation hints | ✅ Implemented | ~55% | `services/access-service.ts`, `routes/access.ts` |
| **Presence** | GPS location persistence, BLE detection, geofence check, trail, overview | ✅ Implemented | ~55% | `services/presence/service.ts`, `stores/prisma-presence-store.ts` |
| **Incidents** | CRUD, lifecycle, assignment, role-scoped visibility | ❌ Stub | ~5% | `routes/incidents.ts` — returns empty arrays, no DB writes |
| **Alerts** | Alert generation, status update, frontend visibility | ❌ Missing | 0% | No backend model or route |
| **Faculty** | Faculty role, class-scoped attendance, faculty profile | ⚠️ Partial | ~30% | `UserRole.FACULTY` in schema; `FacultyProfile` model; `FacultyAssignment`; no faculty routes or UI |
| **Reliability Scoring** | Behavioral score, risk signals, admin visibility | ❌ Missing | 0% | README intent only |
| **Realtime / WebSocket** | Live presence/alerts/incidents push to dashboard | ❌ Missing | 0% | README intent only |
| **Mobile App** | Student app for attendance, access, parking | ❌ Missing | 0% | Folder + README only |
| **Frontend — Auth UX** | Login, activation, token lifecycle, protected routes | ✅ Implemented | ~80% | `services/authApi.ts`, `contexts/AuthContext.tsx`, `App.tsx` |
| **Frontend — Role Model** | STUDENT, ADMIN, SECURITY, FACULTY routing | ✅ Implemented | ~75% | `types/index.ts` — all 4 roles defined; FACULTY has no route surface yet |
| **Frontend — Student Lookup** | Admin-side student search and profile detail | ✅ Live | ~70% | `dataApi.ts` — `USE_MOCK_STUDENT_LOOKUP = false`; wired to `/admin/students` and `/students/:id/profile` |
| **Frontend — Attendance Pages** | Student own history, admin list, anomalies, manual mark | ✅ Live | ~65% | `dataApi.ts` — `USE_MOCK_ATTENDANCE = false`; wired to `/attendance/me`, `/attendance/records`, `/attendance/faculty/mark` |
| **Frontend — Access Pages** | Student own history, admin event list, access check | ✅ Live | ~65% | `dataApi.ts` — `USE_MOCK_ACCESS = false`; wired to `/access/me/events`, `/access/events`, `/access/check` |
| **Frontend — Presence Pages** | Map overview, student trail, live location | ✅ Live | ~55% | `dataApi.ts` — `USE_MOCK_PRESENCE = false`; wired to `/presence/overview`, `/presence/:id`, `/presence/:id/trail` |
| **Frontend — Admin Dashboard** | Aggregate stats, recent events | ❌ Mock | ~15% | `AdminDashboard.tsx` — still imports directly from `mocks/data` |
| **Frontend — Incidents / Alerts** | Incident list, lifecycle, alert status | ❌ Mock | ~10% | `dataApi.ts` — `USE_MOCK = true` umbrella flag covers incidents and alerts |
| **Dev Reset** | Reseed demo data via API | ✅ Implemented | 100% | `routes/dev-reset.ts`, `dev/demo-reset.ts` — **unauthenticated, destructive** |

---

### 5.2 Backend — Route-by-Route Status

#### Auth Routes (`plugins/auth.ts`)

| Endpoint | Status | Notes |
|---|---|---|
| `POST /auth/activate` | ✅ Real | Prisma-backed; bcrypt hash on first password set |
| `POST /auth/login` | ✅ Real | Roll# or email; device binding; HS256 JWT (15m/7d) |
| `POST /auth/logout` | ⚠️ Functional but insecure | Works but NOT JWT-protected — body supplies `studentId` |
| `POST /auth/device/switch` | ⚠️ Functional but insecure | Works but NOT JWT-protected — body supplies `studentId` |
| `POST /auth/refresh` | ✅ Real | Rotates tokens; validates refresh flag in JWT |
| `POST /auth/password/forgot` | ⚠️ Functional but leaks token | Works; logs token to console AND returns it in response body |
| `POST /auth/password/reset` | ✅ Real | Validates token expiry; invalidates active session after reset |

#### Student Routes (`routes/students.ts`)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /students/me` | ✅ Real | JWT-protected; returns full profile from DB |
| `GET /students/:studentId/profile` | ✅ Real | JWT-protected; student can only fetch self, ADMIN/SECURITY can fetch any |

#### Admin Routes (`routes/admin-students.ts`)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /admin/students` | ✅ Real | JWT-protected; ADMIN only; paginated + search |
| `POST /admin/students` | ⚠️ Functional but leaks token | Works; creates pending account + profile; returns `activationToken` in response |

#### Attendance Routes (`routes/attendance.ts`)

| Endpoint | Status | Notes |
|---|---|---|
| `POST /attendance/mark` | ✅ Real | JWT-protected; STUDENT only; QR expiry, geofence gate, enrollment check, PRESENT/LATE window |
| `POST /attendance/faculty/mark` | ✅ Real | JWT-protected; FACULTY or ADMIN only; manual status override |
| `GET /attendance/me` | ✅ Real | JWT-protected; student's own records, paginated + filtered |
| `GET /attendance/sessions/:id/summary` | ✅ Real | JWT-protected; FACULTY or ADMIN only; per-session summary |
| `GET /attendance/records` | ✅ Real | JWT-protected; ADMIN or FACULTY; full list, paginated + filtered |

#### Access Routes (`routes/access.ts`)

| Endpoint | Status | Notes |
|---|---|---|
| `POST /access/check` | ✅ Real | JWT-protected; ADMIN or SECURITY only; records event; basic v0 deny rules |
| `GET /access/me/events` | ✅ Real | JWT-protected; self-scoped access history, paginated |
| `GET /access/events` | ✅ Real | JWT-protected; ADMIN or SECURITY; full event list, paginated + filtered |
| `GET /access/:studentId` | ✅ Real | JWT-protected; legacy route; student self or ADMIN/SECURITY |

#### Presence Routes (`routes/presence.ts` → `services/presence/`)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /presence/overview` | ✅ Real | JWT-protected; ADMIN or SECURITY; all active users with last location |
| `GET /presence/:studentId` | ✅ Real | JWT-protected; ownership-checked; presence summary (isPresent, lastSeen) |
| `GET /presence/:studentId/trail` | ✅ Real | JWT-protected; ownership-checked; location history as trail |
| `POST /presence/update-location` | ✅ Real | JWT-protected; writes GPS location to DB |
| `GET /presence/current/:userId` | ✅ Real | JWT-protected; ADMIN/SECURITY or self |
| `GET /presence/history/:userId` | ✅ Real | JWT-protected; ADMIN/SECURITY or self; with geofence enrichment |
| `POST /presence/batch-upload` | ✅ Real | JWT-protected; offline sync bulk upload |
| `POST /presence/ble-detection` | ✅ Real | JWT-protected; stores BLE detection event |
| `POST /presence/check-geofence` | ✅ Real | JWT-protected; checks if user's last location is inside a named zone |

#### Incident Routes (`routes/incidents.ts`)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /incidents` | ❌ Stub | Returns empty array; no DB reads |
| `POST /incidents` | ❌ Stub | Returns mock hardcoded ID; no DB writes |

#### Utility Routes

| Endpoint | Status | Notes |
|---|---|---|
| `GET /health` | ✅ Real | Always 200 OK |
| `POST /dev/demo/reset` | ⚠️ Works but dangerous | Reseeds entire DB; **no authentication required** |

---

### 5.3 Backend Services — Internal State

#### `AttendanceService` (`services/attendance-service.ts`)
- **QR expiry:** 45-second hard limit from `qrIssuedAt` epoch
- **Attendance windows:** PRESENT within 10 min of session start; LATE within 30 min; rejected outside
- **Geofence gate:** Mandatory for QR path in V1 — `geofenceValidated: false` throws `GEOFENCE_FAILED`
- **Enrollment check:** Verifies `StudentGroupMembership` for the session's section
- **Duplicate guard:** Unique constraint on `(accountId, classSessionTemplateId, scheduledDate)`
- **Faculty mark:** Bypasses QR/geofence; directly sets status; any valid status including `EXCUSED`
- **Pagination:** All list methods support page/pageSize with a 100-record max

#### `AccessService` (`services/access-service.ts`)
- **V0 deny rules (in order):** inactive account → disabled geofence → STUDENT on PARKING geofence → RFID mismatch (when submitted)
- **Escalation hint:** Returns `shouldEscalate: true` when 3+ DENIED events in last 60 minutes for same account
- **Event recording:** Every check (ALLOW or DENY) produces a persisted `AccessEvent` row
- **Pagination:** All list methods support filtering by accountId, geofenceId, action, date range

#### `PresenceService` (`services/presence/service.ts`)
- **Location persistence:** `PresenceLocation` rows in DB (lat, lng, recordedAt)
- **BLE persistence:** `BleDetection` rows (deviceId, seenBy, recordedAt)
- **Geofence enrichment:** All location results are enriched with matched geofence name/id at read time
- **Freshness threshold:** 15-minute window for `isPresent` determination
- **Batch upload:** Validates each location before bulk insert
- **Overview:** Aggregates all accounts with their latest location for the admin map view

#### `AuthService` (`services/auth-service.ts`)
- Prisma-backed: all state in PostgreSQL, no in-memory fallback
- Device binding: unique constraint on `(accountId, deviceId)` in `Session` table
- Token rotation on refresh: invalidates old session, creates new
- Password reset: invalidates active session after successful reset

---

### 5.4 Frontend — Page-by-Page Status

| Page | Route | Data Source | Status |
|---|---|---|---|
| Login | `/login` | Real backend | ✅ Live |
| Activation | `/activate` | Real backend | ⚠️ Wired but response contract mismatch (backend returns `{account}`, frontend expects `{user, tokens}`) |
| Student Dashboard | `/dashboard` | Mocks | ❌ Mock-backed |
| Student Attendance | `/attendance` | Real backend | ✅ Live (`USE_MOCK_ATTENDANCE = false`) |
| Student Access | `/access` | Real backend | ✅ Live (`USE_MOCK_ACCESS = false`) |
| Student Alerts | `/alerts` | Mocks | ❌ Mock-backed |
| Student Account | `/account` | Real backend (read) | ⚠️ Profile fetch is real; Edit Profile button is disabled |
| Student Support | `/support` | Static/mock | ❌ Mock-backed |
| Admin Dashboard | `/dashboard` (admin) | Mocks | ❌ Mock-backed — direct mock imports |
| Admin Students | `/admin/students` | Real backend | ✅ Live (`USE_MOCK_STUDENT_LOOKUP = false`) |
| Admin Attendance | `/admin/attendance` | Real backend | ✅ Live (`USE_MOCK_ATTENDANCE = false`) |
| Admin Access | `/admin/access` | Real backend | ✅ Live (`USE_MOCK_ACCESS = false`) |
| Admin Presence | `/admin/presence` | Real backend | ✅ Live (`USE_MOCK_PRESENCE = false`) |
| Admin Incidents | `/admin/incidents` | Mocks | ❌ Mock-backed (backend stub) |
| Admin Alerts | `/admin/alerts` | Mocks | ❌ Mock-backed (no backend) |
| Admin Activity | `/admin/activity` | Mocks | ❌ Mock-backed |
| Settings | `/settings` | Local state | Functional (theme toggle, no backend) |

---

### 5.5 Known Bugs & Contract Drifts

1. **Activation response mismatch** — `POST /auth/activate` returns `{ message, account: { studentId, email, status } }` but `authApi.ts` treats it as a login response and expects `{ accessToken, refreshToken, user }`. `ActivationPage.tsx` will fail at runtime after a successful activation attempt.

2. **`/dev/demo/reset` has no authentication** — Any unauthenticated caller can wipe and reseed the database. This is in `app.ts` which registers `devReset` before any auth guard.

3. **`auth.ts` contains a large commented-out old implementation** (~100 lines) sitting above the live implementation. This creates maintenance confusion.

4. **`deprecated auth.ts`** exists in `routes/` and should be deleted.

5. **`markedByFacultyId` is a raw string** in `AttendanceRecord` — not a foreign key relation to `Account`. Faculty attribution will produce weak audit trails.

6. **`Incident.type` and `Incident.status` are plain `String`** in the schema — not enums. Cross-service consistency risk.

7. **No frontend automatic token refresh** — On any 401, `apiClient.ts` clears localStorage and redirects to `/login`, even when a valid 7-day refresh token exists.

8. **`dataApi.ts` top-level `USE_MOCK = true`** still gates incidents, alerts, activity, and the student dashboard behind mocks. Individual domain flags override this for attendance, access, presence, and student lookup.

9. **FACULTY role has no frontend route surface** — `App.tsx` routes use `ADMIN` and `SECURITY` for admin paths. A user who logs in with `FACULTY` role will hit `DashboardRouter` which only returns `AdminDashboard` or `StudentDashboard` based on `isAdminRole` — which only checks ADMIN/SECURITY, so FACULTY would be routed to `StudentDashboard`.

10. **`/students/:id/activity` has no backend route** — `dataApi.ts` calls `GET /students/${id}/activity` but no such route exists in the backend.

---

## 6. Security Audit

### 6.1 Open Findings

#### S1 — HIGH — Logout and device-switch are not JWT-protected

`POST /auth/logout` and `POST /auth/device/switch` accept a caller-supplied `studentId` in the request body without first verifying the caller's JWT. Any unauthenticated or third-party caller who knows a `studentId`/`deviceId` pair can log out another account.

**Location:** `backend/api-gateway/src/plugins/auth.ts`

**Fix:** Add `onRequest: [fastify.authenticate]` to both handlers. Derive `studentId` from `request.user.sub` rather than the request body.

---

#### S2 — HIGH — Password reset token is logged and returned in the API response

```ts
console.log(` Token: ${resetToken}`);
return reply.code(200).send({ ..., resetToken }); // DEV ONLY — remove before production
```

Reset tokens are high-sensitivity credentials. Returning them in the response body collapses the email/reset-channel security model. Logging them leaks secrets to terminal history and any log aggregation.

**Location:** `backend/api-gateway/src/plugins/auth.ts` — `POST /auth/password/forgot`

**Fix:** Remove `resetToken` from the response body. Remove the `console.log`. Gate any dev visibility behind `EXPOSE_DEV_TOKENS=true` env flag.

---

#### S3 — HIGH — Activation token is returned from the admin create-student endpoint

```ts
return reply.code(201).send({
  ...,
  activationToken: created.activationToken, // leaked
});
```

Activation tokens are sensitive onboarding secrets. Returning them in a REST response means any API consumer (or log) can capture them.

**Location:** `backend/api-gateway/src/routes/admin-students.ts` — `POST /admin/students`

**Fix:** Omit `activationToken` from the response. Deliver it out-of-band (email) or via a dev-only endpoint gated on `NODE_ENV === 'development'`.

---

#### S4 — HIGH — `/dev/demo/reset` is unauthenticated and destructive

`POST /dev/demo/reset` reseeds the entire database without any authentication check. Registered unconditionally in `app.ts`, it is reachable in any environment.

**Location:** `backend/api-gateway/src/routes/dev-reset.ts`, `backend/api-gateway/src/app.ts`

**Fix:** Gate the route registration behind `if (process.env.NODE_ENV !== 'production')`. Add at minimum a static `DEV_RESET_SECRET` header check.

---

#### S5 — MEDIUM — Real credentials are committed to the repository

```
backend/api-gateway/.env        → DATABASE_URL with password, JWT_SECRET
docker-compose.yml              → POSTGRES_USER, POSTGRES_PASSWORD
```

Even as dev-only credentials, committing secrets trains insecure habits and they can accidentally be reused.

**Fix:** Remove committed `.env`. Replace with `.env.example` using placeholders. Use `docker-compose.override.yml` or environment substitution for local credentials.

---

#### S6 — MEDIUM — Frontend hydrates auth state from localStorage without verification

On app boot, `AuthContext.tsx` reads the token and user from localStorage and marks the session as authenticated before making any API call. An expired or tampered token will not be caught until the next API request fails.

**Location:** `frontend/.../src/contexts/AuthContext.tsx`

**Fix:** On boot, call `GET /students/me` before marking `isAuthenticated: true`. Alternatively, decode the JWT client-side to pre-check expiry.

---

#### S7 — MEDIUM — No automatic token refresh flow on frontend

Backend issues 7-day refresh tokens but the frontend never calls `POST /auth/refresh`. On any 401, the user is forcibly logged out even if their refresh token is still valid.

**Location:** `frontend/.../src/services/apiClient.ts`

**Fix:** Intercept 401 responses, call `/auth/refresh` once with the stored refresh token, retry the original request, and only redirect to login if refresh fails.

---

#### S8 — LOW — `auth.ts` contains a large commented-out legacy implementation

The entire old auth plugin (~100 lines) sits commented out above the live implementation in the same file. This is not a security vulnerability but is a maintenance hazard — the two implementations are not obviously distinguishable at a glance.

**Fix:** Delete the commented block entirely. The migration history and git log provide the historical record.

---

#### S9 — LOW — bcrypt work factor is hardcoded at 10

```ts
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
```

Acceptable for development, but not configurable per environment.

**Fix:** Read from `config.bcryptRounds` with a default of 10 for dev and 12 for production.

---

### 6.2 Role Consistency

The backend uses uppercase Prisma enum values (`STUDENT`, `ADMIN`, `SECURITY`, `FACULTY`) in JWT payloads. The attendance, access, and presence routes use `role.toUpperCase()` comparisons, which is correct. However:

- `incidents.ts` uses `role?.toUpperCase() === 'ADMIN'` correctly in the `isAdmin` helper.
- The FACULTY role is present in the schema and JWT but has no route surface. A FACULTY login will work but will receive no meaningful capability beyond `/students/me`.

The frontend `types/index.ts` now correctly defines all four uppercase roles and includes `normalizeUserRole()` which maps to uppercase. `App.tsx` uses uppercase role strings in `allowedRoles` arrays, which is consistent.

---

## 7. API Reference

### Authentication Model

- `accessToken` — HS256 signed JWT, 15-minute expiry. Payload: `{ sub: accountId, deviceId, role, iat, exp }`.
- `refreshToken` — HS256 signed JWT, 7-day expiry. Same payload plus `isRefresh: true`.
- All protected routes require `Authorization: Bearer <accessToken>`.

### Auth Endpoints

```
POST /auth/activate          Body: { activationToken, password }
POST /auth/login             Body: { identifier, password, deviceId }
POST /auth/logout            Body: { studentId, deviceId }         ← insecure (S1)
POST /auth/device/switch     Body: { studentId, oldDeviceId, newDeviceId } ← insecure (S1)
POST /auth/refresh           Body: { refreshToken }
POST /auth/password/forgot   Body: { identifier }
POST /auth/password/reset    Body: { resetToken, newPassword }
```

### Student Endpoints (JWT required)

```
GET  /students/me
GET  /students/:studentId/profile
```

### Admin Endpoints (JWT + ADMIN role required)

```
GET  /admin/students          Query: ?q=, ?page=, ?pageSize=
POST /admin/students          Body: { rollNumber, email, firstName, lastName, rfidTag? }
```

### Attendance Endpoints (JWT required)

```
POST /attendance/mark                     Body: { classSessionTemplateId, scheduledDate, qrToken, qrIssuedAt, geofenceValidated }   ← STUDENT only
POST /attendance/faculty/mark             Body: { studentAccountId, classSessionTemplateId, scheduledDate, status }                 ← FACULTY/ADMIN only
GET  /attendance/me                       Query: filters, pagination
GET  /attendance/sessions/:id/summary     Params: id (ClassSessionTemplate UUID), Query: scheduledDate  ← FACULTY/ADMIN only
GET  /attendance/records                  Query: filters, pagination  ← ADMIN/FACULTY only
```

### Access Endpoints (JWT required)

```
POST /access/check            Body: { accountId, geofenceId, action, credentialType?, credentialValue? }  ← ADMIN/SECURITY only
GET  /access/me/events        Query: filters, pagination
GET  /access/events           Query: filters, pagination  ← ADMIN/SECURITY only
GET  /access/:studentId       Query: filters, pagination
```

### Presence Endpoints (JWT required)

```
GET  /presence/overview                          ← ADMIN/SECURITY only
GET  /presence/:studentId                        → { isPresent, lastSeen }
GET  /presence/:studentId/trail                  → trail[]
POST /presence/update-location                   Body: { lat, lng, timestamp?, userId? }
GET  /presence/current/:userId
GET  /presence/history/:userId
POST /presence/batch-upload                      Body: [{ userId, locations: [{ lat, lng, timestamp }] }]
POST /presence/ble-detection                     Body: { deviceId, seenBy, timestamp? }
POST /presence/check-geofence                    Body: { zoneName, userId? }
```

### Incident Endpoints (JWT required, stub only)

```
GET  /incidents     → { incidents: [] }
POST /incidents     → { id: 'incident-123', studentId, message }
```

### Utility

```
GET  /health
POST /dev/demo/reset   ← UNAUTHENTICATED, destructive
```

---

## 8. Database Schema

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `STUDENT`, `ADMIN`, `SECURITY`, `FACULTY` |
| `AccountStatus` | `PENDING`, `ACTIVE` |
| `AccessAction` | `ENTRY`, `EXIT`, `DENIED` |
| `AccessReason` | `OUT_OF_HOURS`, `INVALID_RFID`, `INACTIVE_ACCOUNT`, `UNAUTHORIZED_AREA`, `UNKNOWN_GEOFENCE` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` |
| `AttendanceMethod` | `QR`, `BLE`, `MANUAL`, `GEOFENCE` |

### Models

| Model | Purpose | Key Relations |
|---|---|---|
| `Account` | Core identity (login, role, status, tokens) | → Session, StudentProfile, FacultyProfile, AttendanceRecord, AccessEvent, PresenceLocation, BleDetection, Incident, StudentGroupMembership, FacultyAssignment |
| `Session` | Device-bound token pairs (access + refresh) | → Account; unique on `(accountId, deviceId)` |
| `StudentProfile` | Extended student data (name, RFID tag) | → Account (1:1) |
| `FacultyProfile` | Faculty data (name, department, title) | → Account (1:1) |
| `Course` | Course definition (code, title, dept, credits) | → Section[] |
| `Section` | Course section (e.g. CS101-A, term, year) | → Course, StudentGroup[], ClassSessionTemplate[], FacultyAssignment[] |
| `StudentGroup` | Sub-group within a section (e.g. A1, A2) | → Section, StudentGroupMembership[], ClassSessionTemplate[], FacultyAssignment[] |
| `StudentGroupMembership` | Student ↔ Group enrollment | → Account, StudentGroup; unique on `(groupId, accountId)` |
| `FacultyAssignment` | Faculty ↔ Section/Group teaching assignment | → Account, Section?, StudentGroup? |
| `ClassSessionTemplate` | Recurring class slot (day, time, room, geofence) | → Section, StudentGroup?, Geofence?, AttendanceRecord[] |
| `AttendanceRecord` | Single attendance event per student per session date | → Account, ClassSessionTemplate; unique on `(accountId, classSessionTemplateId, scheduledDate)` |
| `Geofence` | Physical zone (name, type, coordinates, radius) | → AccessEvent[], ClassSessionTemplate[] |
| `PresenceLocation` | Raw GPS point per account | → Account |
| `BleDetection` | BLE proximity detection event | → Account |
| `AccessEvent` | Gate/zone entry-exit-denial event | → Account, Geofence |
| `Incident` | Security/attendance issue record | → Account |

### Schema Gaps

- `Incident.type`, `Incident.status` — plain `String` instead of Prisma enums. Risk of inconsistent values cross-service.
- `Geofence.type` — plain `String` instead of enum.
- `AttendanceRecord.markedByFacultyId` — raw `String?` instead of a `@relation` to `Account`. No referential integrity for faculty attribution.
- No `Alert` model — alerts are frontend-only mock data with no backend persistence.
- No presence-level `state` model (e.g., "last known zone") — presence is inferred at query time from raw `PresenceLocation` records.

---

## 9. Installation & Local Setup

### System Requirements

- **Node.js** v18+
- **npm** v9+
- **Docker & Docker Compose** (for PostgreSQL)
- **Git**

### Files Not in Repository (Must Be Created)

```
backend/api-gateway/.env
node_modules/         (all levels)
dist/                 (all levels)
```

### Step-by-Step Setup

```bash
# 1. Clone
git clone <repo-url>
cd nexus

# 2. Create environment file
cat > backend/api-gateway/.env << 'EOF'
DATABASE_URL="postgresql://nexus_admin:nexus_secure_password_2026@localhost:5432/nexus_platform?schema=public"
JWT_SECRET="your-secret-here"
PORT=3000
NODE_ENV=development
EOF

# 3. Start PostgreSQL
docker-compose up -d

# 4. Install backend dependencies
npm install

# 5. Apply migrations
cd backend/api-gateway
npx prisma migrate deploy

# 6. Seed dev data
npx prisma db seed

# 7. Build backend
cd ../..
npm run build

# 8. Install frontend dependencies
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm install
cd ../../..

# 9. Start backend (Terminal 1)
npm run dev --workspace=@nexus/api-gateway

# 10. Start frontend (Terminal 2)
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev
```

### URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Prisma Studio | `npx prisma studio` (from `backend/api-gateway/`) |

### Seed Accounts

| Roll Number | Password | Role | Status |
|---|---|---|---|
| CS21001 | *(activation required)* | STUDENT | PENDING |
| CS21002 | pass123 | STUDENT | ACTIVE |
| CS21003 | pass123 | STUDENT | ACTIVE |
| CS21004 | pass123 | STUDENT | ACTIVE |
| SEC1001 | secure123 | SECURITY | ACTIVE |

---

## 10. Demo Runbook

### Before Every Demo

1. **Reset demo data** (clears sessions, reseeds fresh data):
   ```bash
   curl -X POST http://localhost:3000/dev/demo/reset
   ```
   Or use the **Reset Demo Data** button in the top-left corner of the login page.

2. **Start services** if not running:
   - Terminal 1: `npm run dev --workspace=@nexus/api-gateway` (port 3000)
   - Terminal 2: `cd frontend/web-dashboard/campus-guardian-dashboard-main && npm run dev` (port 5173)

3. **Open:** http://localhost:5173

### Demo-Ready Flows (Backend-Wired)

#### Flow 1 — Admin Student Lookup
1. Log in as a SECURITY user (`SEC1001` / `secure123`).
2. Navigate to **Students** → search by name or roll number.
3. Click a student → shows real profile from DB.
4. Show **Attendance** and **Access History** tabs (real backend data).

#### Flow 2 — Attendance (Admin View)
1. Log in as SECURITY.
2. Navigate to **Attendance**.
3. Shows real `AttendanceRecord` rows from DB with course, room, status, geofence validated flag.
4. Demonstrate manual mark via the Faculty Mark form.

#### Flow 3 — Access Control
1. Navigate to **Access**.
2. Shows real `AccessEvent` rows — entries, exits, and denied events.
3. Use the Access Check form (requires `accountId` and `geofenceId` UUIDs from the DB).

#### Flow 4 — Presence Map
1. Navigate to **Presence**.
2. Shows the overview of students with last-known coordinates and geofence enrichment.

#### Flows with Honest Caveats (Mock-Backed or Stub)

- **Incidents** — UI exists; backend returns empty arrays. Present as workflow preview only.
- **Alerts** — No backend at all. Mock data only.
- **Admin Dashboard** — Aggregate stats are mock. Individual feature pages are real.
- **Activation Flow** — Response contract is mismatched between backend and frontend. Do not demo activation in a live session unless fixed.

---

## 11. Service Boundaries (Planned Microservices)

These are architecture-level planning boundaries. None of the following are implemented as standalone services. Their intended domain ownership is documented for future extraction.

### identity-service
- Student profiles, credentials, device registration, sessions, RBAC.
- **Currently:** Implemented directly in `api-gateway/src/plugins/auth.ts` and `stores/prisma-auth-store.ts`.

### campus-service
- Campus physical/logical topology: campuses, zones, buildings, rooms, gates, parking.
- Geofence definitions and policy metadata.
- **Currently:** Geofence model exists in schema; no dedicated service.

### schedule-attendance-service
- Timetable, class sessions, events, attendance records, attendance validation.
- **Currently:** Course/Section/Group/ClassSessionTemplate schema exists; `attendance-service.ts` handles the mark logic. No timetable management API.

### presence-service
- GPS/BLE intake, last-known location, movement trails, presence state.
- **Currently:** `services/presence/` is a reasonably functional module within the gateway.

### access-service
- Gate/parking access rules, verification flow (grant/deny), access events.
- **Currently:** `services/access-service.ts` implements v0 logic within the gateway.

### reliability-service
- Behavioral reliability score per student, risk signals, risk categories.
- **Currently:** README intent only. No schema, no code, no API.

### incident-service
- Alerts/incidents lifecycle, assignment, escalation, audit logs.
- **Currently:** `Incident` model in schema; `routes/incidents.ts` is a stub returning empty data.

### realtime
- WebSocket/SSE push layer: presence changes, new alerts, incident lifecycle events.
- **Currently:** README intent only. No code.

### ml-services
- Scoring and predictions as event consumers; does not own persistent state.
- **Currently:** README intent only. No code.

### ingestion
- Raw event intake and validation from mobile/IoT devices; forwarding to domain services.
- **Currently:** README intent only. No code.

---

## 12. Historical Progress Summary

### Key Milestones Reached

| Date | Milestone |
|---|---|
| Early sprint | Initial Fastify app, in-memory auth, UUID tokens |
| ~2026-03-28 | Switched to Prisma/PostgreSQL; JWT with `@fastify/jwt`; bcrypt password hashing |
| 2026-04-04 | Prisma schema expanded with Profile, Geofence, AttendanceRecord, AccessEvent, Incident; seed script with realistic dev data |
| 2026-04-06 | CORS fixed (PATCH/DELETE added); timetable/faculty models added (Course, Section, Group, FacultyProfile, FacultyAssignment, ClassSessionTemplate); FACULTY enum added; frontend UserRole updated to uppercase; mock flags split per domain (attendance, access, presence, student lookup now live) |
| 2026-04-06 | AttendanceService with real QR/geofence/window logic; AccessService with v0 deny rules; PresenceService with DB-backed location and BLE |
| 2026-04-06 | Admin student list endpoint; password reset flow; token refresh flow |
| 2026-04-30 | State as audited in this document |

### Completion Trend

| Date | Estimate | Basis |
|---|---|---|
| ~2026-03-15 | ~25% | In-memory auth only; no Prisma |
| 2026-04-06 (AM) | ~32% | Schema real; domain routes all stubs |
| 2026-04-06 (PM) | ~43% | Attendance/access/presence services implemented |
| 2026-04-30 | ~47% | Frontend integration deeper; presence service more complete |

---

## 13. Recommended Next Steps

### Immediate (Correctness & Security)

1. **Fix the activation response contract** — `POST /auth/activate` must return `{ accessToken, refreshToken, user }` (or `authApi.ts` must be updated to handle the current response shape). The activation UX is broken today.

2. **Protect `/auth/logout` and `/auth/device/switch` with JWT** — Add `onRequest: [fastify.authenticate]` and derive `studentId` from `request.user.sub`.

3. **Remove token disclosure from API responses** — Strip `resetToken` from `POST /auth/password/forgot` response and `activationToken` from `POST /admin/students` response.

4. **Gate `/dev/demo/reset` by environment** — Wrap registration in `if (process.env.NODE_ENV !== 'production')`. Add a secret header check for safety.

5. **Delete dead code** — Remove the commented-out old auth plugin block from `plugins/auth.ts`. Delete `routes/deprecated auth.ts`.

### Short Term (Gaps That Block Demos)

6. **Implement real incident routes** — `GET /incidents` should read from DB scoped by role; `POST /incidents` should create a real `Incident` row. Add `PATCH /incidents/:id` for status updates.

7. **Add automatic token refresh to the frontend** — Intercept 401 in `apiClient.ts`, call `/auth/refresh`, retry once, and only log out if refresh fails.

8. **Wire the Admin Dashboard** — `AdminDashboard.tsx` imports mocks directly. Replace with aggregated API calls (student count from `/admin/students`, recent access from `/access/events`, recent attendance from `/attendance/records`).

9. **Fix the `FACULTY` role routing on the frontend** — `isAdminRole()` should include `FACULTY` for faculty-specific views, or add a `FACULTY` branch in `DashboardRouter` that routes to a faculty-specific layout.

### Medium Term (Feature Completeness)

10. **Timetable management API** — Add routes to create/list/update Courses, Sections, Groups, and ClassSessionTemplates. Currently the schema exists but there is no API surface to populate it (only the seed script).

11. **Admin lifecycle operations** — Add suspend/reactivate account, resend activation, RFID tag update, and bulk student import to `admin-students.ts`.

12. **Convert `Incident.type`, `Incident.status`, `Geofence.type` to Prisma enums** — Prevents cross-service string inconsistency. Requires a migration.

13. **Add `markedByFacultyId` as a proper relation** — Change from `String?` to a `@relation` to `Account` for referential integrity.

14. **Build frontend token refresh and boot verification** — Both S6 and S7 security findings.

### Later / V-Final

15. **Reliability scoring service** — Schema, batch job, score API, admin visibility. Only meaningful after attendance and access produce trustworthy signal volume.

16. **Realtime push** — WebSocket or SSE layer for live presence, incident, and alert updates. Required before the security dashboard is genuinely useful.

17. **Mobile app** — Student app for QR scanning, attendance marking, and access at gates. Backend contract needs to be stable first.

18. **Remove committed secrets from source control** — Rotate the committed JWT_SECRET. Add `.env` to `.gitignore` with an `.env.example` template.
