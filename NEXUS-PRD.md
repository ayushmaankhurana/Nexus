# NEXUS — Product Requirements Document

> **Version:** 1.1  
> **Last updated:** 2026-05-07 (updated per Nexus Answers.md)  
> **Status:** Living document — supersedes all previous README, audit, progress, handoff, and installation documents including the earlier NEXUS.md.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Role Definitions](#5-role-definitions)
6. [Authorization Matrix](#6-authorization-matrix)
7. [Location Verification Design](#7-location-verification-design)
8. [Timetable Model & Attendance Flow](#8-timetable-model--attendance-flow)
9. [Workflow Specifications](#9-workflow-specifications)
10. [Current Implementation Status](#10-current-implementation-status)
11. [API Reference](#11-api-reference)
12. [Database Schema](#12-database-schema)
13. [Security Audit](#13-security-audit)
14. [Immediate Implementation Plan](#14-immediate-implementation-plan)
15. [Phased Delivery Roadmap](#15-phased-delivery-roadmap)
16. [Testing Strategy](#16-testing-strategy)
17. [Production Deployment](#17-production-deployment)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [Known Gaps & Deferred Work](#19-known-gaps--deferred-work)
20. [Installation & Local Setup](#20-installation--local-setup)
21. [Demo Runbook](#21-demo-runbook)

---

## 1. Project Overview

NEXUS is a full-stack unified campus intelligence platform that consolidates attendance tracking, access control, real-time presence monitoring, and security incident management into a single system. It replaces manual roll calls and siloed campus systems with multi-signal presence verification, structured audit trails, and role-differentiated dashboards.

### Core Value Propositions

| Domain | Value |
|---|---|
| **Attendance** | Students mark attendance via QR + dual location verification (GPS geofence + BLE beacon); no manual roll calls. |
| **Access Verification** | A single credential (student ID + bound device) gates campus entry, buildings, and parking. |
| **Security Monitoring** | Real-time presence tracking, loitering detection, anomaly alerts for administrators and security staff. |
| **Faculty Management** | Faculty view and manage attendance only for their assigned sections; no cross-section data exposure. |
| **Offline Resilience** | DOLN (Delay-Optimized Local Network) enables offline presence logging with later batch sync. |

### Key Design Principles

1. **Admin-provisioned only** — No public self-signup; all accounts created by campus administrators.
2. **One active device per student** — Prevents credential sharing; simplifies location tracking.
3. **Device binding with switching** — Students can migrate to a new device but not use two simultaneously.
4. **Structured error codes** — All failures return semantic codes (e.g., `DEVICE_ALREADY_BOUND`) for clean client handling.
5. **Scope enforcement at service layer** — Role checks alone are insufficient; section/group ownership is enforced in service logic, not just route guards.
6. **Dual-signal location verification** — GPS geofence confirms building-level presence; BLE beacon confirms room-level presence. Both signals are stored and correlated.
7. **Audit attribution** — Every write action records the acting account, timestamp, and reason.

---

## 2. Architecture

### Current Architecture (Monolithic)

```
Browser / Mobile App
        │
        ▼
[React Frontend :5173] ←→ [API Gateway :3000] (Fastify + TypeScript)
                                    │
                             ┌──────┴───────┐
                             │  Plugins     │  JWT Auth (HS256), CORS
                             │  Routes      │  /auth, /students, /attendance,
                             │              │  /access, /presence, /incidents,
                             │              │  /admin/students, /dev/demo/reset
                             │  Services    │  AttendanceService, AccessService,
                             │              │  AuthService, PresenceService
                             │  Stores      │  PrismaAuthStore, PrismaPresenceStore
                             └──────┬───────┘
                                    │
                             [PostgreSQL 15]
                             (Docker Compose + Prisma ORM)
```

### Planned Architecture (Microservices — Phase 5)

```
identity-service      → auth, accounts, devices, sessions
campus-service        → geofences, buildings, rooms, topology
schedule-attendance   → timetable, class sessions, attendance records
presence-service      → GPS/BLE intake, location state, trail
access-service        → gate rules, access events, RFID validation
reliability-service   → behavioral scoring (ML)
incident-service      → alerts, incidents, lifecycle, escalation
realtime              → WebSocket/SSE push layer
ingestion             → raw event intake from mobile/IoT
```

None of the above are implemented. All logic currently lives in the monolithic API gateway. `backend/services/` folders are README stubs only.

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend API | Fastify (Node.js), TypeScript | 4.0.0 / 5.0.0 |
| Authentication | `@fastify/jwt` HS256, bcrypt | 8.0.1 / 6.0.0 |
| Database | PostgreSQL 15 via Docker Compose | 15 |
| ORM | Prisma | 7.6.0 |
| Validation | Zod | 3.0.0+ |
| Logging | Pino | 8.0.0 |
| Frontend Framework | React, Vite, TypeScript | 18.3.1 / 5.4.19 / 5.8 |
| UI Components | Radix UI + shadcn/ui, Tailwind CSS | Latest / 3.4.17 |
| Routing | React Router | v6.30.1 |
| State / Data | TanStack Query, React Hook Form | 5.83.0 / 7.61.1 |
| Charts | Recharts | 2.15.4 |
| Testing | Vitest (unit), Playwright (E2E) | 3.2.4 / 1.57.0 |
| Monorepo | npm workspaces | — |
| Containerization | Docker Compose (database only) | — |
| Mobile App (Phase 5) | React Native (cross-platform iOS + Android) | — |

---

## 4. Repository Structure

```
nexus/
├── NEXUS-PRD.md                      ← This document (single source of truth)
├── NEXUS.md                          ← Previous audit document (superseded)
├── docker-compose.yml                ← PostgreSQL 15 setup
├── package.json                      ← Root npm workspaces (backend/core, backend/api-gateway)
├── tsconfig.base.json                ← Shared TypeScript config
│
├── backend/
│   ├── api-gateway/                  ← ALL live backend code lives here
│   │   ├── src/
│   │   │   ├── app.ts                ← Fastify app factory (CORS, JWT, route registration)
│   │   │   ├── server.ts             ← Entry point
│   │   │   ├── routes/
│   │   │   │   ├── attendance.ts     ← Attendance endpoints
│   │   │   │   ├── presence.ts       ← Presence/location endpoints (delegates to service)
│   │   │   │   ├── access.ts         ← Access control endpoints
│   │   │   │   ├── students.ts       ← Student profile endpoints
│   │   │   │   ├── admin-students.ts ← Admin student management
│   │   │   │   ├── incidents.ts      ← Incident endpoints (stub)
│   │   │   │   ├── health.ts         ← Health check
│   │   │   │   ├── dev-reset.ts      ← Demo data reset (dev only)
│   │   │   │   └── deprecated auth.ts ← Dead code, to be deleted
│   │   │   ├── plugins/
│   │   │   │   └── auth.ts           ← Auth routes + JWT middleware
│   │   │   ├── services/
│   │   │   │   ├── attendance-service.ts
│   │   │   │   ├── access-service.ts
│   │   │   │   ├── auth-service.ts
│   │   │   │   └── presence/
│   │   │   │       ├── controller.ts ← Request handling + role enforcement
│   │   │   │       ├── service.ts    ← Business logic
│   │   │   │       ├── model.ts      ← TypeScript interfaces
│   │   │   │       ├── routes.ts     ← Route registration
│   │   │   │       ├── utils.ts      ← Haversine, geofence helpers
│   │   │   │       └── index.ts      ← Barrel exports
│   │   │   ├── stores/
│   │   │   │   ├── prisma-auth-store.ts
│   │   │   │   └── prisma-presence-store.ts
│   │   │   ├── schemas/auth.ts       ← Zod validation schemas
│   │   │   ├── types/                ← TypeScript type extensions
│   │   │   ├── lib/prisma.ts         ← Singleton Prisma client
│   │   │   └── dev/demo-reset.ts     ← Seed helper
│   │   └── prisma/
│   │       ├── schema.prisma         ← Full data model (14+ models)
│   │       ├── seed.ts               ← Dev seed data (only way to populate timetable)
│   │       └── migrations/           ← 6 migration files
│   ├── core/                         ← @nexus/core shared utilities (logger, config, types)
│   └── services/                     ← ARCHITECTURE STUBS ONLY — no code
│
├── frontend/
│   └── web-dashboard/campus-guardian-dashboard-main/
│       └── src/
│           ├── App.tsx               ← Routes, role-based navigation
│           ├── main.tsx              ← Vite entry, QueryClient setup
│           ├── pages/
│           │   ├── auth/             ← LoginPage, ActivationPage
│           │   ├── student/          ← StudentDashboard, Attendance, Access, Alerts, Account, Support
│           │   └── admin/            ← AdminDashboard, Students, Attendance, Access, Incidents,
│           │                           Presence, Alerts, Activity
│           ├── components/
│           │   ├── layout/           ← ProtectedRoute, AppLayout, AppHeader, AppSidebar
│           │   ├── shared/           ← DataTable, StatCard, StatusBadge, ActivityFeed
│           │   └── ui/               ← shadcn/ui primitives
│           ├── contexts/
│           │   └── AuthContext.tsx   ← Global auth state, localStorage persistence
│           ├── services/
│           │   ├── apiClient.ts      ← Axios instance + auth interceptor
│           │   ├── authApi.ts        ← Auth-specific API calls
│           │   └── dataApi.ts        ← All domain API calls + mock fallbacks
│           ├── types/index.ts        ← Shared TypeScript types + role helpers
│           ├── mocks/                ← Mock data (used when USE_MOCK* flags = true)
│           └── hooks/                ← use-mobile, use-toast
```

---

## 5. Role Definitions

### STUDENT
Campus students who use NEXUS to mark attendance, track their own history, and manage their device binding. Students operate entirely within their own data scope — they cannot view any other student's data.

**Primary capabilities:**
- Mark attendance via BLE beacon detection (default), QR scan (override), for enrolled classes
- View own attendance history with filtering
- View own access event history (entry/exit logs)
- Push GPS location and BLE beacon detections
- **Cannot** view their own presence trail — presence trail is admin/security/faculty-only

### FACULTY
Teaching staff who manage attendance for assigned sections and monitor presence for their students. Faculty scope is enforced at the service layer via `FacultyAssignment` — a faculty user cannot view or modify data outside their assigned teaching scope. One person does not hold multiple roles; separate accounts are issued if someone has both faculty and student status.

**Primary capabilities:**
- Manual mark / override attendance for assigned sections (highest-priority method, overrides BLE and QR)
- Generate QR code for a class session (displayed on projector at end of class)
- View attendance records and session summaries scoped to assigned sections
- View presence overview scoped to students in assigned sections
- View own campus access events (entry/exit logs) — same self-view as students
- View timetable data for assigned sections (Phase 3)

### SECURITY
Physical security personnel who monitor campus access, respond to incidents, and track campus-wide presence. Security sees all students for safety purposes but **cannot** modify academic records or override attendance under any circumstances.

**Primary capabilities:**
- Campus-wide presence overview (all students, all geofences)
- Access event logs (all students)
- Perform gate access checks (entry/exit/deny)
- Create and triage security incidents (Phase 2)

### ADMIN
Campus administrators who own the full system configuration including student lifecycle, timetable setup, and cross-domain oversight.

**Primary capabilities:**
- All SECURITY capabilities
- Student account lifecycle (create, activate, suspend, reactivate)
- Faculty account management
- Timetable CRUD (courses, sections, groups, assignments, session templates) — Phase 3
- Geofence and policy management
- Campus-wide attendance override
- Configure faculty attendance edit window (per section/course)
- Configure `PresenceLocation` data retention period (30, 60, or 90 days rolling)
- Configure per-geofence-type presence freshness thresholds
- Destructive operations in non-production environments only

### DEPT_ADMIN (Planned — Phase 4+)
A sub-admin role scoped to a single department. Has view-only access to all sections, groups, students, and timetables within their department. Cannot create accounts, modify timetables, or access other departments' data. Requires extending `UserRole` enum and adding department-scope enforcement at the service layer.

---

## 6. Authorization Matrix

### Route-Level Access

| Route / Capability | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| `/dashboard` | Own student view | Faculty ops view | Ops dashboard | Ops dashboard |
| `/attendance` (student self-history) | Allow | Allow (own self-history) | Deny | Allow |
| `/admin/attendance` | Deny | **Allow, scoped to assigned sections** | Allow, campus-wide | Allow |
| `POST /attendance/faculty/mark` | Deny | **Allow, scoped to assigned sections** | **Deny (never)** | Allow (bypasses section check) |
| `/access/me/events` (self-history) | Allow | **Allow (own entry/exit logs)** | Allow (own) | Allow |
| `/admin/access` | Deny | Deny | Allow | Allow |
| `/admin/presence` | Deny | **Allow, scoped to assigned students** | Allow, campus-wide | Allow, campus-wide |
| `/presence/:id/trail` | Own only | Any student in assigned sections | Any student | Any student |
| `/admin/students` | Deny | Deny | Deny | Allow |
| `/admin/incidents` | Deny | Deny | Allow | Allow |
| `/admin/alerts` | Deny | Deny | Allow | Allow |
| `/admin/activity` | Deny | Deny | Allow | Allow |
| `/settings` | Allow | Allow | Allow | Allow |

### Entity-Level Rules

- Students may read only their own profile, attendance history, and access event history. Students **cannot** view their own presence trail or movement data.
- Faculty may read and update attendance only for students connected to assigned sections, groups, or class sessions. This is enforced in `AttendanceService.listAttendance()` and `AttendanceService.facultyMarkAttendance()`.
- Faculty may read presence only for students enrolled in their assigned sections. This is enforced in `PresenceController.getPresenceOverview()` which calls a faculty-scoped service method.
- Faculty may read their own campus access event history (entry/exit logs), mirroring the student self-view.
- Security may read access and presence campus-wide but **cannot** modify timetable, attendance, or student account data under any circumstances — including emergency/lockdown scenarios.
- Admin may manage all entities, subject to environment protections on destructive operations.
- Every write action is audit-attributed: `markedByFacultyId`, JWT `sub`, timestamps.
- Every faculty or admin change to an attendance record is appended to an immutable `AttendanceChangeLog` associated with that session's data.

### Backend Presence Role Matrix

| Endpoint | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| `GET /presence/overview` | Deny | **Allow (own sections only)** | Allow (all) | Allow (all) |
| `GET /presence/:id/trail` | Own only | Any student (read) | Any student | Any student |
| `POST /presence/update-location` | Own only | Own only | Can update any | Can update any |
| `POST /presence/batch-upload` | Own only | Own only | Any student | Any student |
| `POST /presence/ble-detection` | Own | Own | Own | Own |
| `POST /presence/check-geofence` | Own only | Own only | Any student | Any student |

---

## 7. Location Verification Design

### Dual-Signal Architecture

NEXUS uses two location signals with distinct roles:

| Signal | Technology | Precision | Role |
|---|---|---|---|
| BLE Beacon | Bluetooth Low Energy proximity | Room-level (~5–10m) | **Primary attendance verification** — confirms student is in the specific classroom |
| GPS Geofence | Device GPS + server-side Haversine | Building-level (~20–50m) | **Supplementary presence tracking only** — not used to mark attendance; used for campus presence map and trail |

**Attendance method clarification:** Attendance is marked by BLE beacon detection (classroom-level verification) as the default method. GPS geolocation is NOT used as an attendance signal — it is used solely for the presence monitoring overlay (campus map, student trail, loitering detection). Students with GPS disabled can still mark attendance via BLE beacon alone.

**GPS push frequency and rate limit:** The mobile app pushes GPS coordinates approximately every 60–90 seconds and on app startup/attendance page refresh. The client enforces a rate limit of **max 3 pushes per 90-second rolling window** to prevent burst floods from rapid app open/close cycles.

**BLE beacon format:** The schema and mobile app must support **both iBeacon** (UUID/major/minor) **and Eddystone** (UID or URL) beacon formats. `bleBeaconId` on `ClassSessionTemplate` should store a normalized identifier that can be resolved to either format.

**Why both signals are retained:** BLE provides strong room-level presence confirmation. GPS provides a broader campus-level presence picture for security monitoring that BLE alone cannot give across a full campus topology.

### Current Implementation

- **GPS:** `PresenceLocation` table stores `(latitude, longitude, recordedAt)` per account.
- **BLE:** `BleDetection` table stores `(deviceId, seenBy, recordedAt)` per account. `seenBy` is the beacon identifier that detected the student's device.
- **Geofence matching:** `PresenceService` uses Haversine formula (`utils.ts`) to match GPS locations against `Geofence` records (circular geofences with `coordinates` JSON + `radius` float).
- **Attendance validation:** The `AttendanceService.markAttendance()` checks `input.geofenceValidated: boolean`, which is supplied by the mobile client after the client has verified presence via either GPS or BLE.

### Current Gap

`ClassSessionTemplate` has a `geofenceId` (for building-level GPS zone) but no `bleBeaconId` field for classroom-level beacon mapping. Without this:
- The server cannot independently verify which BLE beacon corresponds to which classroom.
- The mobile client must combine both signals before setting `geofenceValidated: true`.
- Server-side BLE validation against the scheduled classroom is deferred to Phase 3 (requires schema migration + beacon hardware pairing flow).

### Presence Enrichment

The presence overview and trail endpoints enrich raw GPS coordinates with geofence names at read time (`findContainingGeofence()` in `utils.ts`). A student's last-known position is displayed as the geofence name (e.g., "CS Building") rather than raw coordinates. BLE detections are stored but not yet incorporated into the presence overview — this is a Phase 3 enhancement that would show "BLE: CS101 Classroom Beacon" as an additional signal.

---

## 8. Timetable Model & Attendance Flow

### Schema Chain

```
Course
  └── Section (courseId, code, term, year)
        ├── StudentGroup (code: "A1", "A2")
        │     └── StudentGroupMembership (groupId, accountId) ← enrollment
        ├── FacultyAssignment (facultyAccountId → sectionId or groupId)
        └── ClassSessionTemplate (sectionId, groupId?, dayOfWeek, startTime, endTime, room, geofenceId?)
              └── AttendanceRecord (accountId, classSessionTemplateId, scheduledDate, status, method)
```

### Attendance Method Hierarchy (3-Tier)

Attendance has three methods with strict override priority. A higher-priority method always wins:

| Priority | Method | Who triggers | Overrides |
|---|---|---|---|
| 3 (highest) | **MANUAL** — faculty or admin marks directly | Faculty / Admin | Overrides BLE and QR |
| 2 | **QR** — student scans faculty-displayed QR code | Student (via mobile app) | Overrides BLE result |
| 1 (default) | **BLE** — classroom beacon detects student device | Automatic (beacon + mobile app) | Baseline |

**Default state:** All enrolled students begin each session as ABSENT. Any method that verifies presence updates the record to PRESENT or LATE. Students not reached by any method remain ABSENT after the session.

### How Attendance Works End-to-End

1. **Admin seeds (or creates via API)** a `ClassSessionTemplate` for every recurring class slot, linked to a `Section`, optional `StudentGroup`, and the classroom's BLE beacon ID (`bleBeaconId`).

2. **During class** the classroom BLE beacon passively detects students' bound devices. The mobile app reports BLE detections to the backend (`POST /presence/ble-detection`). The server schedules **5 BLE scan windows** per session:
   - **3 scans** in the first 10 minutes (PRESENT window)
   - **2 scans** in the 10–30 minute range (LATE window)
   
   A student must be detected in **at least 2 of 5 scans** to be marked PRESENT via BLE. Detection only in the LATE-window scans may result in a LATE status (see open question on BLE LATE logic).

3. **At any point from class start to 5 minutes after end**, the faculty member may optionally trigger a QR code from the faculty dashboard. The QR is displayed on a projector and expires after **45 seconds**. **QR may not be generated at all** — it is a faculty-discretion override mechanism, not a mandatory step. Students who missed BLE detection can scan the QR to mark themselves present.

4. **Student scans QR.** The app POSTs `{ classSessionTemplateId, scheduledDate, qrToken, qrIssuedAt }` to `/attendance/mark`. The server validates:
   - QR token age ≤ 45 seconds.
   - QR generation time is within the valid window (class start to end + 5 minutes).
   - Student is enrolled: `StudentGroupMembership` where `group.sectionId === template.sectionId`.
   - Time window: PRESENT if scan is within session window; LATE if within late window.
   - No duplicate; if BLE record exists, QR result takes precedence (method upgrades to QR).

5. **After class**, within the admin-configured edit window, faculty may manually mark or override any student's attendance record. Each manual change is appended to the `AttendanceChangeLog` with actor, timestamp, old value, and new value.

6. **After the edit window closes**, the session is locked. Any subsequent admin override also creates a `AttendanceChangeLog` entry.

### Faculty Manual Mark Flow

1. Faculty selects a student, session, and date in the attendance management page.
2. `POST /attendance/faculty/mark` → `AttendanceService.facultyMarkAttendance()`.
3. Service verifies `FacultyAssignment` exists for the faculty account and the session's section (ADMIN bypasses this).
4. Service verifies the current time is within the admin-configured edit window for this section.
5. Upserts the `AttendanceRecord` with `method: MANUAL`, `markedByFacultyId: facultyAccountId`.
6. Appends an `AttendanceChangeLog` record with full before/after state.

### Cancelled Class Handling

When a class session is marked as cancelled by an admin or faculty:
- The `ClassSessionTemplate` instance for that date is flagged `cancelled: true`.
- All attendance expectations for that date are voided — no ABSENT records are generated.
- The session is excluded from final course attendance calculations.
- Enrolled students see "Class Cancelled" rather than "Absent" for that date.

### Timetable Conflict Rules

Two courses may share a room **or** a timeslot but never the same room **and** timeslot simultaneously. A conflict check must be raised during timetable upload/seeding. Conflicting entries are rejected with a descriptive error.

### Substitute Faculty

If Faculty A substitutes for Faculty B on a specific date, Faculty A is given a date-scoped `FacultyAssignment` for that session only. There is no separate "substitute" model; the existing assignment model covers this with a date field.

### Attendance Percentage Threshold

A minimum attendance threshold of **75% per course** and **75% overall** is enforced. The system flags and alerts when a student falls below the threshold.

**Group-aware denominator:** A section may have sessions for all groups or for a specific group only. The denominator for each student's attendance percentage counts only the sessions their group was scheduled to attend — not all sessions in the section. This ensures students in Group A are not penalized for Group B-only sessions.

The threshold applies to each student's enrollment. Alerts are generated at the course and overall level. (Alert recipients and threshold configurability — see open questions.)

### Excused Absences

Only **ADMIN** can mark an attendance record as `EXCUSED`. Two paths are supported:

1. **Direct override:** Admin navigates to the attendance record and sets status to `EXCUSED` directly.
2. **Student-initiated workflow:** Student submits an excuse request through the web app. The request appears in an admin queue. Admin approves or rejects it. Approval updates the `AttendanceRecord` status to `EXCUSED` and logs the change in `AttendanceChangeLog`.

Faculty cannot set `EXCUSED` status — this is admin-only.

### Attendance Export

Attendance records are exportable in CSV and PDF formats for grade submission and compliance reporting. Export is available to FACULTY (own sections) and ADMIN (any section). The export includes student name, roll number, session date, status, method, and any change log entries.

### Key Constants

| Constant | Value | Effect |
|---|---|---|
| `QR_TOKEN_TTL_SECONDS` | 45 | QR codes expire 45 seconds after generation |
| `PRESENT_WINDOW_MIN` | 10 | Scans within 10 minutes of session start → PRESENT |
| `LATE_WINDOW_MIN` | 30 | Scans 10–30 minutes after session start → LATE |
| `PRESENCE_FRESHNESS_MS` | Configurable per geofence type | Default: 900,000 ms (15 min); classroom beacons, staircase beacons, parking lot beacons, and cafeteria beacons have independent configurable defaults |
| Faculty edit window | 48 hours (default, admin-configurable per section) | Duration after session end during which faculty can edit attendance |
| BLE scan schedule | 5 scans: 3 in 0–10 min, 2 in 10–30 min | Student needs ≥2 detections to be marked present via BLE |
| QR generation window | Class start time to end time + 5 minutes | Faculty may generate QR at any point in this window; QR is optional |
| GPS push rate limit | Max 3 pushes per 90-second rolling window | Client-enforced debounce to prevent push burst on rapid app reopen |
| Attendance threshold | 75% per course, 75% overall | System flags and alerts when student falls below threshold |

---

## 9. Workflow Specifications

### 9.1 Student Workflow

1. **Activation:** Admin creates account → student receives activation token → student visits `/activate`, sets password.
2. **Login:** Student provides roll number or email + password + device ID → receives `accessToken` (15m) + `refreshToken` (7d).
3. **Attendance marking (BLE primary):**
   - Mobile app detects classroom BLE beacon → reports detection to server → server tallies scan count (≥2 of 5 = present).
   - If faculty displays QR: student scans → QR overrides BLE result → record marked PRESENT.
4. **Token lifecycle:** On any 401, frontend should call `/auth/refresh` before logging out. *(Currently missing — see §13.)*
5. **Self-service:** Student views own attendance history (filtering by date, course, status) and own access entry/exit events. Students **cannot** view their presence trail.
6. **Excuse requests:** Student can submit an excuse request for an absent session through the web app → admin reviews and approves/rejects.

### 9.2 Faculty Workflow

1. **Login:** Faculty logs in → frontend routes to AdminDashboard with faculty-scoped sidebar.
2. **Attendance management:**
   - Navigate to Attendance page → sees attendance records scoped to their assigned sections only.
   - Can filter by session, date, student.
   - Can manually mark/override a student's status → creates MANUAL record with faculty attribution.
3. **Session summary:** Faculty selects a session template + date → sees per-student attendance state, counts (present/late/absent/excused), anomaly flags.
4. **Presence monitoring:**
   - Navigate to Presence Intel → sees ONLY students enrolled in their assigned sections.
   - Can view individual student trails.
   - Presence is enriched with geofence names (building/zone context).
5. **Scope enforcement:** Any attempt to mark attendance for a student outside assigned sections → backend returns `NOT_AUTHORIZED`.

### 9.3 Admin Workflow

1. **Student onboarding:** Create student account → account is PENDING → activation token generated → student activates.
2. **Faculty onboarding:** Create faculty account → assign to sections/groups via `FacultyAssignment`.
3. **Account lifecycle:** Suspend account (ACTIVE → SUSPENDED, reversible) or delete account (multi-confirm required; not readily accessible from normal UI).
4. **Timetable setup (Phase 3):** Create Course → Section → StudentGroup → ClassSessionTemplate → assign BLE beacon.
5. **Attendance oversight:** View campus-wide attendance, override any record, export reports, manage excused absence requests from student workflow queue.
6. **Excused absence management:** Approve or reject student-submitted excuse requests. Can also directly mark any record as EXCUSED without a student request.
7. **System configuration:** Set faculty attendance edit window per section/course (default 48h), configure PresenceLocation retention period (30/60/90 days), configure per-geofence-type presence freshness thresholds.
8. **Presence oversight:** Full campus-wide presence map with all students and geofences.
9. **Access management:** Review access event logs, use access check API for gate operations.
10. **Demo resets:** Use `/dev/demo/reset` in development only.

### 9.4 Security Workflow

1. **Login:** Security staff logs in → AdminDashboard with security-appropriate nav.
2. **Gate checks:** POST `/access/check` with student identifier and geofence ID → system returns ENTRY/EXIT/DENIED decision and records event.
3. **Presence monitoring:** Full campus-wide presence overview — see which students are active, inactive, or missing; drill into individual trails.
4. **Access event review:** Filtered access event log showing recent DENIED events, escalation hints (3+ denials in 60 min).
5. **Incidents (Phase 2):** Create incident reports, triage, assign, update status.

---

## 10. Current Implementation Status

### Overall Completion: ~47% (as of 2026-04-30)

### Feature Matrix

| Feature | Backend | Frontend | Notes |
|---|---|---|---|
| Auth — Activate, login, logout, refresh, reset | ~85% | ~80% | Activation response contract mismatch (see §13) |
| Auth — Security (JWT guards) | ~60% | ~70% | Logout/device-switch unprotected |
| Student profiles | ~75% | ~70% | Edit profile disabled on frontend |
| Admin student management | ~35% | ~70% | Create + list only; no lifecycle ops |
| **Attendance** | **~65%** | **~65%** | QR+geofence works; faculty page broken by routing |
| Timetable / Schedule | ~55% | 0% | Schema + seed only; no CRUD API |
| **Access control** | **~55%** | **~65%** | Entry/exit/deny works |
| **Presence / Location** | **~55%** | **~65%** | GPS works; BLE stored but not enriched in overview |
| Incidents | ~5% | ~10% | Stub only — empty arrays |
| Alerts | 0% | ~10% | No backend model or routes |
| **FACULTY role** | ~40% | **0%** | Backend works; frontend completely broken |
| Reliability scoring | 0% | 0% | — |
| Realtime push | 0% | 0% | — |
| Mobile app | 0% | 0% | — |

### Backend Route Status

#### Auth (`plugins/auth.ts`)
| Endpoint | Status |
|---|---|
| `POST /auth/activate` | ✅ Real — response contract mismatch with frontend |
| `POST /auth/login` | ✅ Real |
| `POST /auth/logout` | ⚠️ Works but NOT JWT-protected (S1) |
| `POST /auth/device/switch` | ⚠️ Works but NOT JWT-protected (S1) |
| `POST /auth/refresh` | ✅ Real — rotates tokens |
| `POST /auth/password/forgot` | ⚠️ Leaks reset token in response (S2) |
| `POST /auth/password/reset` | ✅ Real |

#### Attendance (`routes/attendance.ts`)
| Endpoint | Status |
|---|---|
| `POST /attendance/mark` | ✅ STUDENT only; QR + geofence + window + enrollment check |
| `POST /attendance/faculty/mark` | ✅ FACULTY/ADMIN; section ownership enforced |
| `GET /attendance/me` | ✅ Student self-scoped |
| `GET /attendance/sessions/:id/summary` | ✅ FACULTY/ADMIN |
| `GET /attendance/records` | ⚠️ ADMIN/FACULTY; FACULTY not scoped to assigned sections yet |

#### Presence (`routes/presence.ts`)
| Endpoint | Status |
|---|---|
| `GET /presence/overview` | ⚠️ ADMIN/SECURITY only; FACULTY not permitted; not section-scoped |
| `GET /presence/:studentId` | ✅ Own or ADMIN/SECURITY |
| `GET /presence/:studentId/trail` | ✅ Own or ADMIN/SECURITY |
| `POST /presence/update-location` | ✅ Own or ADMIN/SECURITY |
| `POST /presence/batch-upload` | ✅ Own or ADMIN/SECURITY |
| `POST /presence/ble-detection` | ✅ Own |
| `POST /presence/check-geofence` | ✅ Own or ADMIN/SECURITY |

#### Other
| Endpoint | Status |
|---|---|
| `GET /health` | ✅ Always 200 |
| `GET /admin/students` | ✅ ADMIN only |
| `POST /admin/students` | ⚠️ Works; leaks `activationToken` (S3) |
| `POST /access/check` | ✅ ADMIN/SECURITY |
| `GET /access/events` | ✅ ADMIN/SECURITY |
| `GET /incidents` | ❌ Stub — empty array |
| `POST /incidents` | ❌ Stub — no DB write |
| `POST /dev/demo/reset` | ⚠️ Works; **unauthenticated, destructive** (S4) |

### Frontend Page Status

| Page | Route | Status |
|---|---|---|
| Login | `/login` | ✅ Live |
| Activation | `/activate` | ⚠️ Wired but response contract mismatch |
| Student Dashboard | `/dashboard` | ❌ Mock-backed |
| Student Attendance | `/attendance` | ✅ Live |
| Student Access | `/access` | ✅ Live |
| Student Alerts | `/alerts` | ❌ Mock-backed |
| Student Account | `/account` | ⚠️ Read live; edit disabled |
| Admin Dashboard | `/dashboard` (admin) | ❌ Mock-backed |
| Admin Students | `/admin/students` | ✅ Live |
| Admin Attendance | `/admin/attendance` | ✅ Live (but FACULTY can't reach it) |
| Admin Access | `/admin/access` | ✅ Live |
| Admin Presence | `/admin/presence` | ✅ Live (but FACULTY can't reach it) |
| Admin Incidents | `/admin/incidents` | ❌ Mock-backed |
| Admin Alerts | `/admin/alerts` | ❌ Mock-backed |
| Admin Activity | `/admin/activity` | ❌ Mock-backed |

---

## 11. API Reference

### Authentication Model

- `accessToken` — HS256 JWT, 15-minute expiry. Payload: `{ sub: accountId, deviceId, role, iat, exp }`.
- `refreshToken` — HS256 JWT, 7-day expiry. Same payload + `isRefresh: true`.
- All protected routes require: `Authorization: Bearer <accessToken>`.

### Auth Endpoints

```
POST /auth/activate          Body: { activationToken, password }
POST /auth/login             Body: { identifier, password, deviceId }
POST /auth/logout            Body: { studentId, deviceId }         ← S1: unprotected
POST /auth/device/switch     Body: { studentId, oldDeviceId, newDeviceId } ← S1: unprotected
POST /auth/refresh           Body: { refreshToken }
POST /auth/password/forgot   Body: { identifier }
POST /auth/password/reset    Body: { resetToken, newPassword }
```

### Student Endpoints (JWT required)
```
GET  /students/me
GET  /students/:studentId/profile       ← own only, or ADMIN/SECURITY
```

### Admin Endpoints (JWT + ADMIN required)
```
GET  /admin/students          Query: ?q=, ?page=, ?pageSize=
POST /admin/students          Body: { rollNumber, email, firstName, lastName, rfidTag? }
```

### Attendance Endpoints (JWT required)
```
POST /attendance/mark                        STUDENT only
  Body: { classSessionTemplateId, scheduledDate, qrToken, qrIssuedAt, geofenceValidated }

POST /attendance/faculty/mark                FACULTY/ADMIN only
  Body: { studentAccountId, classSessionTemplateId, scheduledDate, status }

GET  /attendance/me                          STUDENT own records
  Query: ?page=, ?pageSize=, ?from=, ?to=, ?status=

GET  /attendance/sessions/:id/summary        FACULTY/ADMIN only
  Query: ?scheduledDate=

GET  /attendance/records                     ADMIN or FACULTY (FACULTY: auto-scoped to sections)
  Query: ?accountId=, ?classSessionTemplateId=, ?from=, ?to=, ?status=, ?page=, ?pageSize=
```

### Access Endpoints (JWT required)
```
POST /access/check            ADMIN/SECURITY only
  Body: { accountId, geofenceId, action, credentialType?, credentialValue? }
GET  /access/me/events        Self-scoped, paginated
GET  /access/events           ADMIN/SECURITY, paginated + filtered
GET  /access/:studentId       Self or ADMIN/SECURITY
```

### Presence Endpoints (JWT required)
```
GET  /presence/overview              ADMIN/SECURITY (all) or FACULTY (scoped to assigned students)
GET  /presence/:studentId            Self or ADMIN/SECURITY/FACULTY
GET  /presence/:studentId/trail      Self or ADMIN/SECURITY/FACULTY
POST /presence/update-location       Body: { lat, lng, timestamp?, userId? }  ← userId: ADMIN/SECURITY only
GET  /presence/current/:userId       Self or ADMIN/SECURITY/FACULTY
GET  /presence/history/:userId       Self or ADMIN/SECURITY/FACULTY
POST /presence/batch-upload          Own or ADMIN/SECURITY multi-user
POST /presence/ble-detection         Body: { deviceId, seenBy, timestamp? }  ← always own
POST /presence/check-geofence        Body: { zoneName, userId? }  ← userId: ADMIN/SECURITY only
```

### Session Management Endpoints (JWT required, Phase 1)
```
GET  /auth/sessions          Own account — list all active sessions (web: multiple; mobile: one)
DELETE /auth/sessions/:id    Revoke a specific session by ID (cannot revoke current session)
```

### Excuse Request Endpoints (JWT required, Phase 3)
```
POST /attendance/excuse-request    STUDENT — submit excuse for a specific attendance record
GET  /attendance/excuse-requests   ADMIN — list pending/reviewed excuse requests
PATCH /attendance/excuse-requests/:id   ADMIN — approve or reject a request
```

### Incident Endpoints (JWT required, stub only)
```
GET  /incidents     → { incidents: [] }
POST /incidents     → { id: 'incident-123' }  ← no DB write
```

---

## 12. Database Schema

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `STUDENT`, `ADMIN`, `SECURITY`, `FACULTY` |
| `AccountStatus` | `PENDING`, `ACTIVE`, `SUSPENDED` ← SUSPENDED needs to be added |
| `AccessAction` | `ENTRY`, `EXIT`, `DENIED` |
| `AccessReason` | `OUT_OF_HOURS`, `INVALID_RFID`, `INACTIVE_ACCOUNT`, `UNAUTHORIZED_AREA`, `UNKNOWN_GEOFENCE` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` |
| `AttendanceMethod` | `QR`, `BLE`, `MANUAL`, `GEOFENCE` |

### Models

| Model | Purpose | Key Constraints |
|---|---|---|
| `Account` | Identity (login, role, status, tokens) | `rollNumber` unique, `email` unique |
| `Session` | Device-bound token pair | `(accountId, deviceId)` unique |
| `StudentProfile` | Name, RFID tag, external ERP student ID | 1:1 with Account |
| `FacultyProfile` | Name, department (field), title | 1:1 with Account |
| `Course` | Academic subject (code, title, dept field) | `code` unique |
| `Section` | Teaching instance (term, year) | `(courseId, code, term, year)` unique |
| `StudentGroup` | Sub-group within section | `(sectionId, code)` unique |
| `StudentGroupMembership` | Enrollment record | `(groupId, accountId)` unique |
| `FacultyAssignment` | Faculty → Section/Group mapping | — |
| `ClassSessionTemplate` | Recurring class slot | dayOfWeek, startTime, endTime, room, geofenceId? |
| `AttendanceRecord` | Single attendance event | `(accountId, classSessionTemplateId, scheduledDate)` unique |
| `Geofence` | Physical zone | `name` unique, coordinates JSON, radius float |
| `PresenceLocation` | GPS point | `(accountId, recordedAt)` indexed |
| `BleDetection` | BLE beacon detection | `(accountId, recordedAt)` + `(deviceId, recordedAt)` indexed |
| `AccessEvent` | Gate entry/exit/denial | `(accountId, timestamp)` indexed |
| `Incident` | Security incident | `Incident.type` and `Incident.status` are plain String (not enums) — gap |

### Schema Gaps

- `Incident.type`, `Incident.status`, `Geofence.type` — plain `String` instead of Prisma enums.
- `AttendanceRecord.markedByFacultyId` — raw `String?` not a `@relation` to `Account`. Revoked `FacultyAssignment` must not cascade-delete historical attendance records; attribution must survive assignment removal.
- No `Alert` model — alerts are frontend-only mock data.
- No `ClassSessionTemplate.bleBeaconId` — needed for server-side BLE classroom validation.
- No `updatedAt` on `AttendanceRecord` — cannot reconstruct correction history.
- No `AttendanceChangeLog` model — every faculty/admin change to an attendance record must be persisted with actor, timestamp, old value, and new value.
- No `cancelled` flag on `ClassSessionTemplate` per-date instance — needed for cancelled class handling.
- No admin-configurable faculty edit window (per section or course) — must be added before faculty attendance editing can be properly time-gated.
- No per-geofence-type freshness threshold config — `PRESENCE_FRESHNESS_MS` is hardcoded; must be configurable per geofence type (classroom, staircase, parking lot, cafeteria) with type-appropriate defaults.
- No `PresenceLocation` retention policy model — retention period (30/60/90 days rolling) must be admin-configurable and enforced by a scheduled cleanup job.
- No `RefreshToken` invalidation-on-password-reset across all devices — current implementation only invalidates the active session. Must invalidate all `Session` records for the account on password reset.
- `AccountStatus` missing `SUSPENDED` value — needed for account suspension (reversible) and to distinguish from PENDING/ACTIVE.
- No account deletion audit trail — hard deletion must be preceded by multi-confirm UX and should log the deletion event before execution.
- No `ExcuseRequest` model — student-initiated excuse workflow requires a model storing student, attendance record, reason, status (PENDING/APPROVED/REJECTED), admin actor, and resolution timestamp.
- No `BleDetection` scan-count aggregation per session — the 5-scan / ≥2-detected rule requires either storing individual scan events and aggregating, or maintaining a per-session scan count. Current `BleDetection` table stores individual detections but has no session-scoped tally.
- `bleBeaconId` format undefined — must support both iBeacon (UUID/major/minor composite) and Eddystone (UID/URL). Field should store a normalized beacon descriptor, not a raw hardware-specific ID.
- No `externalStudentId` field on `StudentProfile` — needed for future student ERP integration. Field should be nullable and indexed.
- No per-course attendance threshold config — 75% is the system default; if thresholds should be configurable per course, a config model is required. (Whether it's configurable is an open question.)
- No `Session` listing endpoint — web allows multiple concurrent sessions; need `GET /auth/sessions` to enumerate and `DELETE /auth/sessions/:id` to revoke individual sessions.

---

## 13. Security Audit

| ID | Severity | Issue | Location | Fix |
|---|---|---|---|---|
| S1 | HIGH | `/auth/logout` and `/auth/device/switch` not JWT-protected | `plugins/auth.ts` | Add `onRequest: [authenticate]`; derive studentId from `request.user.sub` |
| S2 | HIGH | `resetToken` returned in API response body | `plugins/auth.ts` — `/auth/password/forgot` | Remove from response; gate dev visibility behind env flag |
| S3 | HIGH | `activationToken` returned in admin create-student response | `routes/admin-students.ts` | Omit from response; deliver out-of-band |
| S4 | HIGH | `/dev/demo/reset` unauthenticated in all environments | `app.ts`, `routes/dev-reset.ts` | Gate registration behind `NODE_ENV !== 'production'`; add secret header check |
| S5 | MEDIUM | `.env` with real credentials committed to repository | `backend/api-gateway/.env` | Remove from repo; add `.env.example`; rotate JWT_SECRET |
| S6 | MEDIUM | Frontend hydrates auth state from localStorage without verification | `contexts/AuthContext.tsx` | On boot, call `GET /students/me` before marking `isAuthenticated: true` |
| S7 | MEDIUM | No automatic token refresh — any 401 forces logout | `services/apiClient.ts` | Intercept 401, call `/auth/refresh`, retry once |
| S8 | LOW | Large commented-out legacy auth block in active file | `plugins/auth.ts` | Delete commented block |
| S9 | LOW | `deprecated auth.ts` dead file in routes/ | `routes/deprecated auth.ts` | Delete file |
| S10 | LOW | bcrypt work factor hardcoded at 10 | `auth-service.ts` | Read from config; default 10 dev, 12 prod |

---

## 14. Immediate Implementation Plan

This plan covers the attendance monitoring and location tracking feature set with correct permissions for all roles. It is the current sprint scope.

### What's Being Fixed

1. **FACULTY frontend routing** — Faculty users currently get the student dashboard. Must route to admin-style dashboard with faculty-scoped nav.
2. **Faculty-scoped attendance queries** — `GET /attendance/records` must auto-filter to assigned sections when caller is FACULTY. Currently shows all records.
3. **Faculty-scoped presence queries** — `GET /presence/overview` must show only students in assigned sections for FACULTY. Currently blocked entirely (403).

### Files Modified

| File | Change |
|---|---|
| `frontend/.../src/types/index.ts` | Add `isFacultyRole()` helper |
| `frontend/.../src/App.tsx` | FACULTY in `DashboardRouter`; FACULTY added to attendance + presence route guards |
| `frontend/.../src/components/layout/AppSidebar.tsx` | Add `facultyNav`; select by role |
| `backend/api-gateway/src/services/attendance-service.ts` | Add `facultyAccountId` filter to `listAttendance()` |
| `backend/api-gateway/src/routes/attendance.ts` | Pass `facultyAccountId` to service for FACULTY callers |
| `backend/api-gateway/src/services/presence/service.ts` | Add `getPresenceOverviewForStudents(studentIds[])` |
| `backend/api-gateway/src/services/presence/controller.ts` | Add `canReadPresence()` check; route FACULTY to scoped overview |

### Step-by-Step Changes

#### Step 1 — `types/index.ts`
```typescript
export function isFacultyRole(role?: string | null): boolean {
  return normalizeUserRole(role) === "FACULTY";
}
```

#### Step 2 — `App.tsx`
```typescript
// DashboardRouter: FACULTY shares AdminDashboard
if (isAdminRole(user.role) || isFacultyRole(user.role)) return <AdminDashboard />;

// Route guards: add FACULTY to attendance + presence only
allowedRoles={["ADMIN", "SECURITY", "FACULTY"]}  // for /admin/attendance and /admin/presence
```

#### Step 3 — `AppSidebar.tsx`
```typescript
const facultyNav = [
  { title: "Dashboard",      url: "/dashboard",         icon: LayoutDashboard },
  { title: "Attendance",     url: "/admin/attendance",  icon: CalendarCheck },
  { title: "Presence Intel", url: "/admin/presence",    icon: MapPin },
];
// Select: isAdmin ? adminNav : isFaculty ? facultyNav : studentNav
```

#### Step 4 — `attendance-service.ts`
```typescript
// AttendanceFilters: add facultyAccountId?: string
// In listAttendance(), when facultyAccountId is set:
// → query FacultyAssignment → get sectionIds → get templateIds → filter records
```

#### Step 5 — `routes/attendance.ts`
```typescript
// For GET /attendance/records:
// If caller role === FACULTY, pass facultyAccountId: request.user.sub to service
```

#### Step 6 — `presence/service.ts`
```typescript
async getPresenceOverviewForStudents(studentIds: string[]): Promise<PresenceOverviewResponse>
// Calls store.listStudentPresenceOverview(studentIds) with ID filter
// Reuses same record mapping logic as getPresenceOverview()
```

#### Step 7 — `presence/controller.ts`
```typescript
function canReadPresence(request): boolean {
  return hasAnyRole(request.user.role, ['ADMIN', 'SECURITY', 'FACULTY']);
}
// getPresenceOverview: if FACULTY → resolve assigned studentIds → call scoped method
// assertCanReadUser: use canReadPresence instead of isPrivileged
// resolveBodyUserId (write path): still uses isPrivileged (ADMIN/SECURITY only)
```

### Verification Checklist

- [ ] FACULTY login → AdminDashboard; sidebar: Dashboard, Attendance, Presence Intel
- [ ] FACULTY `GET /attendance/records` → returns only records for assigned sections
- [ ] FACULTY `GET /presence/overview` → returns only students in assigned sections
- [ ] FACULTY with no assignments → both views return empty gracefully
- [ ] FACULTY trail view `GET /presence/:id/trail` → allowed for any student
- [ ] FACULTY `POST /presence/update-location` with another userId → updates own only
- [ ] FACULTY `/admin/incidents` → 403 redirect
- [ ] STUDENT behavior unchanged
- [ ] ADMIN behavior unchanged
- [ ] SECURITY behavior unchanged

---

## 15. Phased Delivery Roadmap

### Phase 1 — Stabilize Current Build
- Fix activation response contract mismatch
- Protect `/auth/logout` and `/auth/device/switch` with JWT (S1)
- Remove token disclosure from API responses (S2, S3)
- Gate `/dev/demo/reset` by environment (S4)
- Delete dead auth code (S8, S9)
- Add frontend token refresh and boot verification (S6, S7)
- Invalidate all refresh tokens across all devices on password reset
- Add `AccountStatus.SUSPENDED` — admin can suspend/reactivate accounts (reversible); add deletion flow with multi-confirm guard
- Add session management endpoints (`GET /auth/sessions`, `DELETE /auth/sessions/:id`) — web supports multiple concurrent sessions; mobile is one device at a time
- Add faculty self-view of campus access events (`/access/me/events`)
- Create faculty seed account in `seed.ts`
- **Fix FACULTY frontend routing and backend scoping** ← Current sprint

### Phase 2 — Close Demo Gaps
- Replace admin dashboard mocks with live aggregated API calls
- Implement incidents backend (real DB reads/writes, role-scoped)
- Add alert persistence model and routes
- Remove all remaining mock-backed surfaces used in demos

### Phase 3 — Faculty, Timetable, and Attendance Completeness
- Build timetable CRUD APIs (courses, sections, groups, assignments, session templates)
- Timetable conflict detection on upload (room + timeslot collision prevention)
- Add faculty session dashboard (today's scheduled sessions, per-session attendance view)
- Faculty-triggered QR code generation (class start to end+5min window; optional)
- Implement 3-tier attendance method hierarchy: BLE default → QR override → MANUAL highest
- BLE 5-scan schedule per session (3 in PRESENT window, 2 in LATE window); ≥2 detections = PRESENT
- BLE dual-format beacon support: iBeacon (UUID/major/minor) and Eddystone (UID/URL)
- Auto-ABSENT generation for all enrolled students not marked by any method after session close
- `AttendanceChangeLog` model: immutable audit trail for all faculty/admin attendance changes
- Admin-configurable faculty attendance edit window (default 48h, per section/course)
- Cancelled class handling: flag, exclusion from calculation, "Class Cancelled" student view
- Substitute faculty: date-scoped `FacultyAssignment` one-off
- Attendance threshold enforcement: 75% per course (group-aware denominator) + 75% overall; flag and alert below threshold
- Excused absence workflow: admin direct override + student-initiated request queue with admin approval
- Attendance export (CSV, PDF) for faculty and admin
- Add `ClassSessionTemplate.bleBeaconId` schema field for server-side BLE classroom validation
- Per-geofence-type freshness threshold (configurable defaults for classroom/staircase/parking/cafeteria)
- GPS push rate limiting enforced server-side (max 3 per 90-second rolling window; reject excess)
- Add `externalStudentId` nullable field to `StudentProfile` for future ERP integration
- Proper `@relation` for `markedByFacultyId` (referential integrity, records survive assignment removal)
- Convert plain-string schema fields to Prisma enums

### Phase 4 — Production Readiness
- Production deployment pipeline (Vercel frontend, containerized backend, managed DB)
- Observability: request logs, auth failure alerts, response time metrics, audit trail
- Secret rotation and environment hardening
- Daily automated DB backups
- Admin-configurable `PresenceLocation` data retention (30/60/90 days rolling, default 60)
- E2E regression suite in CI/CD
- Release gate checks (no unauthenticated destructive routes, no secret-bearing responses)
- DEPT_ADMIN sub-role (department-scoped view-only access)

### Phase 5 — Advanced Platform
- Realtime push (WebSocket/SSE) for live presence, incidents, alerts
- Reliability scoring service (behavioral scoring per student)
- Mobile app — **React Native cross-platform** (iOS + Android); student QR scanning, BLE attendance marking, access at gates
- BLE beacon hardware procurement and integration (hardware is in-scope for this project)
- Planned service extraction where justified by scale
- ML anomaly detection (loitering, unusual access patterns, attendance fraud)

---

## 16. Testing Strategy

### Unit Tests (Vitest)
Cover:
- `auth-service.ts`: token issuance, rotation, expiry
- `attendance-service.ts`: QR expiry, window calculation, enrollment check, faculty scoping logic
- `access-service.ts`: deny rule ordering, escalation hint
- `presence/utils.ts`: Haversine formula, geofence check, BLE enrichment
- `types/index.ts`: role normalization, `isAdminRole`, `isFacultyRole`

### Integration Tests
Cover:
- Full login → refresh → logout flow
- Student attendance mark with valid QR + geofence
- Faculty manual mark for assigned section (allow) and unassigned section (deny)
- `GET /attendance/records` as FACULTY → scoped to assigned sections only
- `GET /presence/overview` as FACULTY → scoped to assigned students only
- Access check event persistence
- Admin student creation without leaking activation token
- Protected route 403 for wrong roles

### End-to-End Tests (Playwright)
Cover:
- Student login, QR attendance mark, view history
- FACULTY login → correct dashboard → attendance management → presence view
- SECURITY login → presence overview → access events
- ADMIN student management flow
- Token refresh during live session (no forced logout on 401)
- Unauthorized route redirects by role

### Critical Regression Suite (CI)
Run on every merge to main:
- Auth smoke (login, refresh, logout)
- Role-routing smoke (each role lands on correct dashboard)
- Attendance happy path (student mark)
- Faculty mark + scoping
- Presence happy path (student location, overview)
- Security access-check

### Coverage Targets

| Area | Target |
|---|---|
| Services | 80% branch coverage |
| Route guards / auth helpers | 90% |
| Critical API routes | 80% integration |
| E2E core journeys | 100% for identified flows |

---

## 17. Production Deployment

### Environment Matrix

| Environment | Purpose | Data | Access |
|---|---|---|---|
| Local | Developer setup | Seed / demo | Individual developer |
| Development | Shared integration | Disposable test | Engineering team |
| Staging | Pre-production verification | Sanitized synthetic | Engineering + demo stakeholders |
| Production | Real campus use | Real data | Restricted operations |

### Deployment Topology

- **Frontend:** Static SPA on Vercel or equivalent CDN.
- **Backend:** Containerized Fastify service (Docker).
- **Database:** Managed PostgreSQL with automated daily backups and tested restore procedure.
- **Reverse proxy / HTTPS:** Nginx or cloud load balancer in front of API.
- **Secrets:** Injected via environment manager (not committed in repo).

### Production Required Controls

- Separate DB credentials per environment.
- Rotated JWT secret (not the committed dev value).
- No `.env` with live credentials in source control.
- `/dev/demo/reset` disabled (`NODE_ENV === 'production'`).
- CORS restricted to approved frontend origin only.
- Structured request logs with request IDs.
- Auth failure and permission denial alerts.

### Release Gate Checklist

A production release is blocked if any of the following are true:
- [ ] Unauthenticated destructive routes are enabled
- [ ] Secret-bearing responses are exposed (resetToken, activationToken)
- [ ] Frontend and backend auth contracts are mismatched
- [ ] FACULTY role has broken frontend routing
- [ ] Staging smoke tests fail

---

## 18. Non-Functional Requirements

### Security
- All mutating routes require JWT unless explicitly public.
- Sensitive tokens never returned in normal API responses.
- All secrets externalized from source control.
- Role checks paired with ownership/scope checks at service layer.
- Every write action audit-attributed to acting account.

### Performance
- All list endpoints support pagination and filtering (max 100 per page enforced).
- Attendance, access, and presence list endpoints must return within acceptable latency under campus-scale load.
- Map and activity views degrade gracefully for large datasets.
- GPS location push: server enforces max 3 accepted pushes per account per 90-second rolling window; excess pushes are rejected with a 429 response.

### Reliability
- Offline batch presence uploads are idempotent where possible.
- Attendance submissions protected from duplicate writes (DB unique constraint).
- QR token TTL (45s) prevents stale replay attacks.

### Auditability
- Manual attendance overrides record `markedByFacultyId`, method=MANUAL, timestamp.
- Every faculty or admin change to an attendance record is appended to an immutable `AttendanceChangeLog` with actor, timestamp, before-state, and after-state.
- Access denials record reason code and geofence.
- Administrative account lifecycle actions logged.

### Privacy
- Presence visibility is role- and scope-limited.
- FACULTY does not receive unrestricted campus surveillance — scoped to assigned students only.
- Students cannot view their own presence trail; they can only view their attendance records and campus access entry/exit logs.
- Student personal data follows least-privilege access across all roles.

### Data Retention
- `PresenceLocation` records are retained for a rolling window configurable by admin: 30, 60, or 90 days. Default is 60 days.
- A scheduled cleanup job enforces the retention window automatically.
- Attendance records, access event logs, and audit logs are not subject to automated deletion — retention policy applies to GPS presence pings only.

---

## 19. Known Gaps & Deferred Work

| Gap | Severity | Phase |
|---|---|---|
| Timetable management CRUD (no API, seed-data-only) | High | Phase 3 |
| `ClassSessionTemplate.bleBeaconId` — no server-side BLE classroom validation | Medium | Phase 3 |
| `GET /attendance/records` for FACULTY not scoped by group (only section) | Low | Phase 3 |
| Faculty session dashboard (today's upcoming sessions view) | Medium | Phase 3 |
| Faculty-triggered QR code generation (currently no UI trigger) | Medium | Phase 3 |
| 3-tier attendance method hierarchy (BLE default, QR override, MANUAL highest) | High | Phase 3 |
| `AttendanceChangeLog` model — no audit trail for faculty/admin attendance changes | High | Phase 3 |
| Admin-configurable faculty attendance edit window | Medium | Phase 3 |
| Auto-ABSENT generation after session close | Medium | Phase 3 |
| Cancelled class handling | Medium | Phase 3 |
| Substitute faculty per date | Low | Phase 3 |
| Timetable conflict detection (room + timeslot) | Medium | Phase 3 |
| Attendance export (CSV, PDF) | Medium | Phase 3 |
| Per-geofence-type configurable freshness threshold | Low | Phase 3 |
| No faculty seed account in `seed.ts` | High | Phase 1 |
| Admin dashboard live aggregates (still mock-backed) | Medium | Phase 2 |
| Incidents backend (empty stubs) | High | Phase 2 |
| Alert persistence model | High | Phase 2 |
| BLE enrichment in presence overview | Medium | Phase 3 |
| Frontend token refresh on 401 | High | Phase 1 |
| Boot-time token verification | Medium | Phase 1 |
| Activation response contract mismatch | High | Phase 1 |
| Committed `.env` credentials | High | Phase 1 |
| Multi-device refresh token invalidation on password reset | High | Phase 1 |
| Faculty self-view of campus access events | Medium | Phase 1 |
| `AccountStatus.SUSPENDED` — no suspension state in enum | High | Phase 1 |
| Account deletion flow with multi-confirm guard | Medium | Phase 1 |
| Session management endpoints (`GET /auth/sessions`, `DELETE /auth/sessions/:id`) | Medium | Phase 1 |
| `PresenceLocation` data retention policy + cleanup job | Medium | Phase 4 |
| BLE 5-scan schedule and ≥2-detection threshold logic | High | Phase 3 |
| BLE dual-format support: iBeacon + Eddystone | Medium | Phase 3 |
| QR generation window enforcement (start to end+5min) | Low | Phase 3 |
| Default 48h faculty attendance edit window (currently no edit window at all) | High | Phase 3 |
| Attendance threshold (75% per course, 75% overall) — no calculation or alerting | High | Phase 3 |
| Group-aware attendance denominator (per-group session counts) | Medium | Phase 3 |
| Excused absence workflow model (`ExcuseRequest`) | Medium | Phase 3 |
| GPS push rate limiting on server side (max 3 per 90s) | Low | Phase 3 |
| `externalStudentId` field on `StudentProfile` for ERP integration | Low | Phase 3 |
| DEPT_ADMIN sub-role | Low | Phase 4+ |
| BLE beacon hardware procurement | High | Phase 5 |
| Realtime push | Medium | Phase 5 |
| Mobile app (React Native) | High | Phase 5 |

---

## 20. Installation & Local Setup

### Requirements
- Node.js v18+, npm v9+, Docker + Docker Compose, Git

### Setup Steps
```bash
# 1. Clone
git clone <repo-url> && cd nexus

# 2. Create .env (NOT committed to repo)
cat > backend/api-gateway/.env << 'EOF'
DATABASE_URL="postgresql://nexus_admin:nexus_secure_password_2026@localhost:5432/nexus_platform"
JWT_SECRET="change-this-to-a-secure-random-value"
PORT=3000
NODE_ENV=development
EOF

# 3. Start PostgreSQL
docker-compose up -d

# 4. Install + build backend
npm install && npm run build

# 5. Apply migrations + seed
cd backend/api-gateway
npx prisma migrate deploy
npx prisma db seed
cd ../..

# 6. Install frontend
cd frontend/web-dashboard/campus-guardian-dashboard-main && npm install && cd ../../..

# 7. Start services (two terminals)
npm run dev --workspace=@nexus/api-gateway    # Terminal 1 → :3000
cd frontend/web-dashboard/campus-guardian-dashboard-main && npm run dev  # Terminal 2 → :5173
```

### URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Prisma Studio | `npx prisma studio` (from `backend/api-gateway/`) |

### Seed Accounts

| Roll / Identifier | Password | Role | Status |
|---|---|---|---|
| CS21002 | pass123 | STUDENT | ACTIVE |
| CS21003 | pass123 | STUDENT | ACTIVE |
| CS21004 | pass123 | STUDENT | ACTIVE |
| SEC1001 | secure123 | SECURITY | ACTIVE |
| *(no faculty seed account — must be created in Phase 1)* | — | FACULTY | — |

> **Phase 1 Action Required:** `seed.ts` does not contain a FACULTY account. A faculty seed account must be added before FACULTY role routing and scoping can be tested or demonstrated. Add it to `seed.ts` and document credentials here.

---

## 21. Demo Runbook

### Before Every Demo
```bash
# Reset to fresh seed data
curl -X POST http://localhost:3000/dev/demo/reset
```

### Demo-Ready Flows (Backend-Wired)

**Flow 1 — Security Dashboard**
- Login as SEC1001 / secure123
- Navigate to Students → search by name/roll
- Navigate to Attendance → real records from DB
- Navigate to Presence → live map with GPS positions

**Flow 2 — Attendance Management**
- In Attendance, show status breakdown: PRESENT / LATE / ABSENT flags
- Demonstrate 3-tier method: BLE (default) → QR (override) → Manual Mark (highest)
- Demonstrate Manual Mark override (Faculty Mark form) — note this requires a faculty seed account (Phase 1 action required)
- Show anomaly flags (late + geofence unvalidated)

**Flow 3 — Presence Map**
- Show student dots on the SVG map
- Click a student → view their movement trail
- Use Location Simulation dropdown to move a student to a geofence

**Flows to Avoid in Live Demo (Broken or Mock-backed)**
- **Activation flow** — response contract mismatch (backend returns `{account}`, frontend expects `{user, tokens}`)
- **Admin Dashboard stats** — mock data
- **Incidents / Alerts** — backend stubs return empty

---

*This document is the single source of truth for NEXUS. Update it with every architectural decision, implementation milestone, or requirement change.*
