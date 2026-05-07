# NEXUS — Next Steps & Open Questions

> **Created:** 2026-05-07  
> **Updated:** 2026-05-07 (incorporated answers from Nexus Answers.md + CLAUDE Questions.md round 2)  
> **Purpose:** 5-step completion roadmap + outstanding questions across all domains before implementation proceeds.

---

## Part 1: 5-Step Completion Plan

Each step is a self-contained milestone with a clear entry condition (what must be true before starting) and exit condition (what must be true to call it done). Steps are ordered so that each one builds on a stable, verified foundation.

---

### Step 1 — Stabilize the Core (Security, Auth, Role Routing)

**Why first:** Everything else — demos, feature development, production — depends on a system that doesn't leak secrets, doesn't have broken role routing, and has a reliable auth lifecycle. These bugs undermine trust in all subsequent work.

**What gets done:**

| Task | Location | Why |
|---|---|---|
| Fix activation response contract | `plugins/auth.ts` + `authApi.ts` | Activation UX is completely broken right now |
| Protect `/auth/logout` + `/auth/device/switch` with JWT | `plugins/auth.ts` | Any unauthenticated caller can log out another user |
| Remove `resetToken` from forgot-password response | `plugins/auth.ts` | HIGH severity secret leak |
| Remove `activationToken` from admin create-student response | `routes/admin-students.ts` | HIGH severity secret leak |
| Gate `/dev/demo/reset` by `NODE_ENV` + secret header | `app.ts`, `routes/dev-reset.ts` | Unauthenticated DB wipe reachable in any environment |
| Add frontend 401 → refresh → retry flow | `services/apiClient.ts` | Users silently lose sessions when access token expires |
| Add boot-time token verification | `contexts/AuthContext.tsx` | App trusts expired/tampered tokens from localStorage |
| Fix FACULTY frontend routing | `App.tsx`, `AppSidebar.tsx`, `types/index.ts` | Faculty users get student dashboard and can't access their pages |
| Scope `GET /attendance/records` to assigned sections for FACULTY | `attendance-service.ts`, `routes/attendance.ts` | Faculty currently see all campus attendance records |
| Scope `GET /presence/overview` to assigned students for FACULTY | `presence/controller.ts`, `presence/service.ts` | Faculty currently get a 403 or see all students |
| Invalidate **all** refresh tokens across **all** devices on password reset | `auth-service.ts`, `stores/prisma-auth-store.ts` | Password reset must terminate all active sessions, not just current device |
| Add `AccountStatus.SUSPENDED` to enum + admin suspend/reactivate endpoints | `prisma/schema.prisma`, `routes/admin-students.ts` | No suspension state exists; ACTIVE/PENDING is insufficient for account lifecycle |
| Add account hard-deletion with multi-confirm guard (not readily accessible in UI) | `routes/admin-students.ts`, frontend admin UI | Deletion is permanent; UI must require multiple confirmations |
| Add session management endpoints: `GET /auth/sessions`, `DELETE /auth/sessions/:id` | `plugins/auth.ts`, `stores/prisma-auth-store.ts` | Web allows multiple concurrent sessions; users need ability to view and revoke individual sessions |
| Add `GET /access/me/events` self-view for FACULTY role | `routes/access.ts` | Faculty currently have no route to view their own campus entry/exit logs |
| Create faculty seed account in `seed.ts` and document credentials | `prisma/seed.ts`, `§21 Demo Runbook` | No faculty seed account exists; FACULTY routing fix cannot be verified without one |
| Delete dead auth code | `plugins/auth.ts`, `routes/deprecated auth.ts` | Maintenance hazard and code confusion |

**Exit condition:** Every role logs in, lands on the correct dashboard, sees only the data they're allowed to see. No secrets appear in API responses. Token refresh works silently. Password reset terminates all active sessions across all devices. Account suspension is reversible. Session management lets users view and revoke individual web sessions. Faculty can view their own campus access history. A fresh demo reset produces a fully functional system.

---

### Step 2 — Close Demo Gaps (Remove All Mock-Backed Surfaces)

**Why second:** The system is not reliably demo-able while major pages still pull from hardcoded mock data. Stakeholders and reviewers will catch this immediately. This step makes every page that matters show real, database-backed information.

**What gets done:**

| Task | Location | Why |
|---|---|---|
| Wire `AdminDashboard.tsx` to live API aggregates | `pages/admin/AdminDashboard.tsx` | Still imports from `mocks/data` directly |
| Implement real incident CRUD backend | `routes/incidents.ts` | Returns empty arrays; no DB writes at all |
| Add `Alert` model to schema + routes | `prisma/schema.prisma`, new `routes/alerts.ts` | No backend model exists; frontend is entirely mocked |
| Connect frontend incident and alert pages to real API | `dataApi.ts` | `USE_MOCK = true` umbrella flag covers both |
| Wire admin activity log to real access/attendance/auth events | `pages/admin/AdminActivity.tsx` | Currently mocked |
| Enable student alerts from real attendance/access anomalies | `pages/student/StudentAlerts.tsx` | Currently mocked |
| Wire student dashboard attendance + access widgets to real data | `pages/student/StudentDashboard.tsx` | Currently mocked |

**Exit condition:** Every page in the app shows live data from PostgreSQL. The `USE_MOCK` flags in `dataApi.ts` are no longer needed for any demo-critical surface. A demo can be run end-to-end without a presenter needing to caveat "this part is a mockup."

---

### Step 3 — Faculty & Timetable Feature Completeness

**Why third:** The timetable is the backbone of the entire attendance system, but it can only be populated today via the seed script. Faculty workflows are partially wired but missing the view that matters most — their scheduled sessions and the ability to manage them session-by-session. Additionally, several core attendance behaviours now have confirmed requirements that need to be built. This step makes the system self-sufficient (no longer seed-dependent).

**What gets done:**

#### Timetable & API
| Task | Location | Why |
|---|---|---|
| Timetable CRUD API — Courses, Sections, Groups | New routes in `routes/` | No API surface exists; admins can't manage academic structure |
| Timetable CRUD API — ClassSessionTemplate, FacultyAssignment | New routes in `routes/` | Session templates only exist via seed |
| Timetable conflict detection on upload/seeding | `attendance-service.ts` or new validation layer | Two courses may share a room OR a timeslot, but never both simultaneously. Conflict must be raised at import time. |
| Substitute faculty: one-off `FacultyAssignment` for a specific date | `prisma/schema.prisma`, new route | Substitute Faculty A for Faculty B on a specific date requires a date-scoped assignment |
| Admin lifecycle operations — suspend, reactivate, RFID update, bulk import | `routes/admin-students.ts` | Currently create + list only |

#### Attendance Flow (3-Tier Hierarchy)
| Task | Location | Why |
|---|---|---|
| Set default attendance state to ABSENT for all enrolled students at session start | `attendance-service.ts` | Confirmed: the default state is absent; students not marked by any method are automatically absent |
| Implement BLE 5-scan schedule per session (3 in first 10 min, 2 in 10–30 min) | `attendance-service.ts`, mobile app | BLE scans 5 times per session; student needs ≥2 detections to be marked present |
| BLE dual-format beacon support: iBeacon (UUID/major/minor) and Eddystone (UID/URL) | `prisma/schema.prisma`, mobile app BLE layer | Hardware procurement is in scope; schema must accommodate both beacon formats |
| Implement QR-as-override: QR mark takes precedence over BLE result | `attendance-service.ts` | A student absent via BLE but present via QR scan is marked present |
| QR generation window enforcement: class start to end+5 minutes | New route + faculty UI | QR is optional and may not be generated at all; when generated, valid only within this window |
| Confirm faculty manual mark as highest-priority override | `attendance-service.ts` | Faculty manual mark overrides both BLE and QR |
| Admin-configurable faculty attendance edit window (default: 48 hours) | `prisma/schema.prisma`, new admin settings route | Default is 48h; admin can set per section/course |
| Full attendance change audit log (`AttendanceChangeLog`) | `prisma/schema.prisma`, `attendance-service.ts` | Every faculty or admin change must be appended to an immutable log with actor, timestamp, before/after state |
| Cancelled class handling: exclude from attendance calculation | `prisma/schema.prisma`, `attendance-service.ts` | Cancelled classes excluded from totals; students see "Class Cancelled" not "Absent" |
| Attendance threshold enforcement: 75% per course + 75% overall | `attendance-service.ts`, alerts system | Group-aware denominator (per-group session counts); flag and alert students below threshold |
| Excused absence workflow: `ExcuseRequest` model + student submission + admin approval | `prisma/schema.prisma`, new routes, admin UI | Two paths: student-initiated approval workflow, or admin direct override. Faculty cannot set EXCUSED. |
| Attendance export (CSV, PDF) | New export route, frontend export button | Required for grade submission and compliance reporting |
| Add `ClassSessionTemplate.bleBeaconId` field + migration | `prisma/schema.prisma` | Required for server-side BLE classroom-level validation |
| Server-side BLE validation in `markAttendance()` | `services/attendance-service.ts` | Currently only GPS geofence is server-validated |
| GPS push rate limiting: reject excess pushes beyond 3 per 90-second rolling window | `routes/presence.ts` or middleware | Prevent GPS push flood from rapid app reopen cycles |
| Add `externalStudentId` nullable field to `StudentProfile` | `prisma/schema.prisma` | Future student ERP integration; field must be indexed |

#### Faculty Dashboard
| Task | Location | Why |
|---|---|---|
| Faculty session dashboard — today's upcoming/active sessions | New `pages/admin/FacultyDashboard.tsx` or update AdminDashboard | Core faculty workflow is completely absent |
| Per-session attendance management view | New page or modal within AdminAttendance | Faculty needs enrolled roster + mark/override per session |
| Faculty view own access history | Student-style access page scoped to faculty account | Faculty should see their own campus entry/exit logs |

#### Schema Hygiene
| Task | Location | Why |
|---|---|---|
| Convert `Incident.type`, `Incident.status`, `Geofence.type` to Prisma enums | `prisma/schema.prisma` + migration | Plain strings risk inconsistency across services |
| Add proper `@relation` for `markedByFacultyId` | `prisma/schema.prisma` + migration | Raw string breaks referential integrity; records must survive FacultyAssignment removal intact |
| Per-geofence-type freshness threshold configuration | `prisma/schema.prisma`, admin settings | 15-min constant is hardcoded; must be configurable per geofence type (classroom, staircase, parking lot, cafeteria), with defaults for each type |

#### Future Consideration (Post-Phase 3)
- **Department Admin sub-role (DEPT_ADMIN):** A sub-admin who has view-only access to all sections under their department. This requires extending the `UserRole` enum, adding a `departmentScope` concept to authorization, and additional route guards. Defer to Phase 4 or beyond unless there is an active requirement.

**Exit condition:** An admin can log in and build the entire timetable through the UI without ever touching the seed script or Prisma Studio. A faculty member sees today's sessions immediately on login, can open any session, see the enrolled roster with attendance states, and mark/override from that view. BLE beacon is the default attendance method (5 scans, ≥2 = present), QR overrides it, and faculty manual marks override both. Every change to an attendance record is audit-logged. Students at risk of falling below the 75% threshold are flagged. The excused absence workflow is live end-to-end.

---

### Step 4 — Production Hardening

**Why fourth:** The system works correctly at this point, but it is not safe to put real student data into. This step closes the remaining security gaps, wires up observability, verifies the deployment pipeline, and confirms the system can survive a real campus load.

**What gets done:**

| Task | Location | Why |
|---|---|---|
| Remove committed `.env` from source control; rotate JWT_SECRET | `backend/api-gateway/.env`, `.gitignore` | Real credentials are currently committed |
| Add `.env.example` with placeholder values | Repo root | Onboarding documentation |
| Production deployment pipeline | CI/CD, Vercel/Docker/managed DB | No production environment exists today |
| Structured request logging with request IDs | `app.ts`, Pino config | Required for incident investigation |
| Auth failure + permission denial alerting | Monitoring layer | Security events must be surfaced |
| Response time metrics and DB error alerts | Monitoring layer | Required for reliability SLA |
| Separate DB credentials per environment | DevOps config | All envs currently use the same seed credentials |
| CORS restricted to production frontend origin | `app.ts` | Currently allows localhost origins |
| Bcrypt work factor configurable (10 dev / 12 prod) | `auth-service.ts` | Currently hardcoded at 10 |
| Admin-configurable `PresenceLocation` data retention | Admin settings route, scheduled cleanup job | Retention is 60 days rolling by default; admin can set 30, 60, or 90 days |
| Full E2E regression suite in CI/CD | Playwright config | Currently no automated test coverage |
| Unit + integration tests for all services | Vitest | Coverage targets: 80% services, 90% route guards |
| Load test attendance, access, presence endpoints | Test tooling | Validate campus-scale performance |
| Daily automated DB backup + tested restore procedure | DevOps | Required before real data enters the system |

**Exit condition:** The system passes all release gate checks from §17 of the PRD. No unauthenticated destructive routes, no secret-bearing responses, correct role routing for all four roles, staging smoke tests pass. CI is green on main. Data retention is configurable and enforced automatically.

---

### Step 5 — Advanced Platform Features

**Why last:** These features require the system to be stable, trusted, and producing reliable data at volume. Realtime push requires a stable data layer; reliability scoring requires months of attendance and access history; the mobile app requires a stable backend contract. None of these can be meaningfully built without Step 4's foundation.

**What gets done:**

| Task | Why |
|---|---|
| Realtime push layer (WebSocket or SSE) | Live presence, incident, and alert updates are meaningless without push — polling is not viable for a security dashboard |
| Reliability scoring service | Behavioral score per student (attendance consistency, access patterns, anomaly rate); only useful after significant signal volume |
| Mobile app — React Native cross-platform | Student QR scanning, BLE attendance marking, access check at gates; confirmed platform is React Native; backend contract must be stable first |
| BLE beacon hardware procurement and integration | Hardware procurement is in project scope; beacon format must be finalized before `bleBeaconId` pairing can be implemented end-to-end |
| Planned microservice extraction | Extract identity, campus, attendance, presence, access, and incident domains into independent services where load or team structure justifies it |
| ML anomaly detection | Loitering detection, unusual access patterns, attendance fraud signals; feeds into reliability scoring |

**Exit condition:** Students can mark attendance and access campus gates entirely through a mobile app. The security dashboard updates in real-time as events occur. Reliability scores are computed and visible to administrators. The system architecture is documented for service extraction.

---

## Part 2: Open Questions

The following questions remain unanswered. They cover features explicitly deferred to future phases (Access Control and Incidents & Alerts are not in Phase 1 scope). These questions do not block current work but should be answered before Phase 2/3 work begins on those domains.

---

### Access Control (Phase 2+)

19. **Gate hardware integration:** How does the physical gate make an access decision? Does gate hardware call `/access/check` directly (requiring near-real-time WebSocket feedback), or does a security officer manually check the system? This determines whether Realtime Push (Step 5) is actually a prerequisite for live access control.

20. **RFID validation scope:** Is RFID tag validation done by the backend (compare submitted tag against `StudentProfile.rfidTag`) or by hardware before the API call? The current access service accepts an optional `credentialValue` but the validation logic is minimal.

21. **Parking zone access rules:** The access service currently denies STUDENT on PARKING geofence by default. Is there a vehicle registration or parking permit system that should allow specific students access to parking, or is the blanket deny intentional?

---

### Incidents & Alerts (Phase 2+)

22. **Incident types:** What are the valid incident types? The schema uses a plain `String` field. Are these freeform (any description), or should they be a closed enum (e.g., UNAUTHORIZED_ACCESS, LOITERING, MEDICAL, SAFETY_CONCERN)?

23. **Alert trigger sources:** What events should automatically generate an alert? Candidates include: 3+ access denials in 60 min, student not seen within a session's geofence despite attendance mark, attendance marked outside geofence, reliability score drop below threshold. Which of these are in scope?

24. **Incident assignment:** When a security officer creates an incident and assigns it to another officer (`assignedTo` field), should the assigned officer receive a notification? This requires either push notifications or the realtime layer — which phase does incident notification belong to?
