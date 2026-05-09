# NEXUS — Current State (as of 2026-05-07)

## Project Overview

NEXUS is a full-stack campus intelligence and security platform. It tracks student attendance, physical access control (gates, buildings), presence/location, and incident management across a university campus.

**Stack:**
- Backend: Fastify (Node.js/TypeScript) + Prisma ORM + PostgreSQL
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Auth: JWT (access token) + refresh token, device-bound sessions

---

## Architecture

Currently a single-service monolith:

```
backend/api-gateway/          <- All backend logic in one Fastify app
  src/
    app.ts                    <- App factory, plugin registration
    plugins/auth.ts           <- Auth routes (login, logout, activate, etc.)
    routes/                   <- Feature route plugins
    services/                 <- Business logic (attendance, presence, access)
    stores/                   <- Prisma-backed data access layer
    dev/demo-reset.ts         <- Seeder / demo reset
  prisma/
    schema.prisma             <- Single schema for all domains
    migrations/               <- SQL migration history

frontend/web-dashboard/       <- React SPA
  src/
    pages/                    <- Route-level page components
    services/                 <- API client, auth API, data API
    contexts/AuthContext.tsx  <- Auth state management
    types/index.ts            <- Shared TypeScript types
```

Planned future state: microservices per domain (auth, attendance, access, presence, incidents). Deferred until Phase 2.

---

## Backend Status by Domain

| Domain | Status | Notes |
|--------|--------|-------|
| Auth (login/logout/refresh) | Live | JWT + refresh token + device-bound sessions |
| Auth (forgot/reset password) | Live | Token logged to console; not emailed |
| Auth (activation) | Live | Returns `{message, account}` — does NOT auto-login |
| Admin: create student | Live | Activation token logged to console only |
| Admin: list students | Live | Role=STUDENT only, paginated |
| Admin: suspend/reactivate | Live | New endpoints added (SUSPENDED enum value) |
| Attendance: student mark (QR) | Live | Requires geofence validation |
| Attendance: faculty manual mark | Live | Faculty scoped to assigned sections |
| Attendance: student history (/me) | Live | Paginated |
| Attendance: admin/faculty list | Live | Faculty auto-scoped to assigned sections |
| Access: check/record entry/exit | Live | SECURITY/ADMIN only |
| Access: student own history | Live | `/access/me/events` |
| Access: global events list | Live | Admin/Security only |
| Presence: location update | Live | Any authenticated user |
| Presence: overview | Live | Admin/Security see all; Faculty see assigned students only |
| Presence: student trail | Live | Admin/Security/Faculty can read; student cannot see own trail |
| Presence: BLE detection | Live (stub) | Stored but not used for attendance |
| Dashboard stats | Live | `/dashboard/stats` — totalStudents, presentToday, accessEventsToday, activeIncidents |
| Incidents | Partial stub | Prisma model exists; route returns placeholder data |
| Alerts | Not implemented | No backend route |
| Activity log | Not implemented | No backend route |
| Session cap enforcement | Not enforced | Spec says 2 web / 1 mobile; DB has `@@unique([accountId, deviceId])` but does not cap count |
| Timetable CRUD | Not implemented | Schema exists; no admin routes to create/edit courses or sections |

---

## Frontend Status by Route/Page

| Route | Page | Data Source | Notes |
|-------|------|-------------|-------|
| /login | LoginPage | Real backend | Working |
| /activate | ActivationPage | Real backend | Redirects to /login after success (no auto-login) |
| /dashboard (STUDENT) | StudentDashboard | Real backend | Attendance + access events live |
| /dashboard (ADMIN/SECURITY/FACULTY) | AdminDashboard | Real backend | Stats from `/dashboard/stats`; incidents section shows "Planned" banner |
| /attendance | StudentAttendance | Real backend | Live |
| /access | StudentAccess | Real backend | Live |
| /alerts (student) | StudentAlerts | Derived from real data | Computed from attendance/access; shows "Planned" banner |
| /account | StudentAccount | Partial | Shows stored user; settings stub |
| /support | StudentSupport | Mock | Support backend not implemented |
| /admin/students | AdminStudents | Real backend | Live CRUD |
| /admin/attendance | AdminAttendance | Real backend | Faculty-scoped via JWT role |
| /admin/access | AdminAccess | Real backend | Live |
| /admin/incidents | AdminIncidents | No data (planned) | Shows "Planned" banner + empty state; mock table removed |
| /admin/presence | AdminPresence | Real backend | Faculty-scoped |
| /admin/alerts | AdminAlerts | No data (planned) | Shows "Planned" banner + empty state; mock table removed |
| /admin/activity | AdminActivity | No data (planned) | Shows "Planned" banner + empty state; mock feed removed |

---

## Role Support Status

| Role | Login | Dashboard | Key Permissions |
|------|-------|-----------|-----------------|
| STUDENT | Yes | StudentDashboard | Own attendance, own access history, no presence trail |
| ADMIN | Yes | AdminDashboard | All read/write, student management, suspend/reactivate |
| SECURITY | Yes | AdminDashboard | All read + access check; cannot mark/override attendance |
| FACULTY | Yes | AdminDashboard (faculty sidebar) | Attendance records (assigned sections only), presence intel (assigned students only), cannot access /admin/students or /admin/incidents |

---

## Schema Maturity

**Implemented and used:**
- Account (with roles STUDENT, ADMIN, SECURITY, FACULTY; status PENDING, ACTIVE, SUSPENDED)
- Session (device-bound, refresh token)
- StudentProfile, FacultyProfile
- Course, Section, StudentGroup, StudentGroupMembership, FacultyAssignment
- ClassSessionTemplate (recurring schedule)
- AttendanceRecord (QR + manual, geofence-validated)
- AccessEvent (ENTRY/EXIT/DENIED with reason)
- Geofence (circle-based; polygon coordinates stored as JSON)
- PresenceLocation, BleDetection
- Incident (model exists; status is a plain String, not an enum)

**Missing from schema:**
- ExcuseRequest model (planned/deferred)
- AttendanceChangeLog (planned/deferred)
- Alert model (no DB representation)
- ActivityLog model (no DB representation)
- Timetable instance rows (only templates; no explicit "session occurred on date X" rows)

---

## Security Status

### Fixed in this session
- `/auth/logout` requires JWT (derives accountId from token, not body)
- `/auth/device/switch` requires JWT
- `resetToken` removed from forgot-password API response (console.log only)
- `activationToken` removed from admin create-student response (console.log only)
- Password reset invalidates ALL sessions for account (not just one device)
- `deprecated auth.ts` dead file deleted
- Large commented-out block at top of `plugins/auth.ts` deleted
- `SUSPENDED` added to AccountStatus enum + migration SQL
- Admin suspend/reactivate endpoints added
- `/dev/demo/reset` now requires `x-demo-secret` header (default: `nexus-demo-2026`)
- Frontend boot-time token verification against `/students/me`
- Frontend 401 → refresh → retry logic in apiClient
- Activation no longer auto-logs in (backend doesn't return tokens)
- `mock-auth-store.ts` (backend dead file) deleted
- Dead mock imports removed from `authApi.ts` (`mockStudentUser`, `mockAdminUser`, `mockSession`)
- `USE_MOCK` flag and mock branches removed from `authApi.ts` (all auth calls are live)
- Fake incident/alert/activity tables removed from admin pages; replaced with honest empty states

### Still open / not yet enforced
- Session cap (2 web / 1 mobile) — DB unique constraint exists but count is not enforced
- Password reset token is delivered via console.log only — no real email transport
- Activation token is delivered via console.log only — no real email transport
- No rate limiting on any endpoint
- No input sanitization beyond Zod validation
- JWT secret falls back to hardcoded string if `JWT_SECRET` env var missing (warns in dev)
- No HTTPS enforcement (handled at infrastructure level)
- RFID tag values are plain strings — no cryptographic validation

---

## Seed/Demo Status

### Seeded accounts (from demo-reset)

| Roll | Email | Password | Role | Status |
|------|-------|----------|------|--------|
| CS21001 | cs21001@campus.edu | pass123 | STUDENT | PENDING (activation token: `activation_token_001`) |
| CS21002 | cs21002@campus.edu | pass123 | STUDENT | ACTIVE |
| CS21003 | cs21003@campus.edu | pass123 | STUDENT | ACTIVE |
| CS21004 | cs21004@campus.edu | pass123 | STUDENT | ACTIVE |
| CS21005 | cs21005@campus.edu | pass123 | STUDENT | ACTIVE |
| CS21006 | cs21006@campus.edu | pass123 | STUDENT | ACTIVE |
| SEC1001 | security1@campus.edu | secure123 | SECURITY | ACTIVE |
| ADM1001 | admin1@campus.edu | secure123 | ADMIN | ACTIVE |
| FAC1001 | faculty1@campus.edu | secure123 | FACULTY | ACTIVE (Dr. Neha Kapoor, CS dept) |

### Seeded data
- 3 geofences: Main Campus Gate, Parking Zone, CS-103 Lab
- CS101 course (Data Structures), Section A, Groups A1/A2
- ClassSessionTemplate: Mon/Wed/Fri 09:00–10:00, CS-103 Lab
- FacultyAssignment: FAC1001 → Section A
- Attendance records: CS21002 PRESENT, CS21004 LATE, CS21005 ABSENT (all for 2026-04-02)
- Access events: allowed entries, denied entry, denied parking for several students

---

## Important Business Rules Currently Enforced

1. STUDENT cannot view `/attendance/records` — 403
2. SECURITY cannot call `/attendance/faculty/mark` — 403
3. FACULTY sees only attendance records for their assigned sections
4. FACULTY sees only presence intel for students in their assigned sections
5. Students cannot see their own presence trail (`/presence/:id/trail`) — only admin/security/faculty can
6. Password reset invalidates ALL sessions for the account
7. Device binding: `@@unique([accountId, deviceId])` — one session per device per account
8. QR token TTL: 45 seconds (enforced in service)
9. Attendance window: 10 min for PRESENT, 30 min for LATE; outside = rejected
10. Geofence validation mandatory for QR attendance marking (V1)
11. `/dev/demo/reset` requires `x-demo-secret` header AND is gated by `NODE_ENV !== production`

## Important Business Rules NOT Yet Enforced

1. Session cap: 2 concurrent web sessions, 1 mobile (spec requires; not implemented)
2. Attendance threshold alerting (< 75% triggers notification — deferred)
3. QR window enforcement per-session (deferred; currently just token TTL)
4. Faculty cannot mark attendance for sections they are not assigned to (enforced in `facultyMarkAttendance` but not in `listAttendance` filter without facultyAccountId)
5. RFID cryptographic validation (plain string comparison only)

---

## Known Risks and Technical Debt

| Risk | Severity | Notes |
|------|----------|-------|
| JWT secret falls back to hardcoded string | High | Will silently use weak secret if `JWT_SECRET` not set in dev |
| No email transport for activation/reset tokens | High | Tokens only logged to console — production blocker |
| Session cap not enforced | Medium | User can create unlimited sessions across devices |
| Incident.status is a plain String, not an enum | Medium | No DB-level constraint; arbitrary strings possible |
| Incidents/Alerts/Activity pages have no backend | Medium | Pages show honest planned/empty state; no fake data shown |
| No backend test suite | Medium | Only `test.http` manual tests; frontend unit tests now exist |
| Prisma `resetToken` is not hashed | Low | Stored in plaintext in DB |
| No pagination on BLE logs | Low | `getBLELogs()` returns all records |
| FacultyAssignment.sectionId can be null | Low | Logic handles it but creates edge cases |

---

## Next Recommended Priorities (Ordered)

1. Add email transport (Nodemailer / SendGrid) for activation and password reset tokens
2. Enforce session cap (2 web / 1 mobile) in `createSession`
3. Build incident and alert backend (models, routes, real data)
4. Add activity log model and backend route
5. Add timetable CRUD endpoints (create course/section/template) for admin
6. Build attendance threshold alerting (75% rule)
7. Add rate limiting (fastify-rate-limit) to auth endpoints
8. Implement automated test suite (Vitest for backend, React Testing Library for frontend)
9. Add refresh token rotation (currently refresh token is reused until expiry)
10. Hash resetToken before storing in DB
