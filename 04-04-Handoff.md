Here’s a `README.md` you can drop into `backend/api-gateway` (or a `docs/PROGRESS.md` at repo root) for your teammates.

***

# Nexus Platform — Backend Data Layer Handoff

_Last updated: 2026‑04‑04_

This document explains the current backend state, what was just completed for the **database & data layer (Person 1’s tasks)**, and what other teammates need to know after pulling this branch.

***

## 1. High‑Level Status

### Overall

- Auth + identity backed by Postgres is **implemented and stable**.
- Core domain tables for profiles, geofences, attendance, access events, and incidents are **in the schema and migrated**.
- A realistic dev dataset is **seeded and reproducible** via a single command.
- Non‑auth feature services (attendance, access, presence, incidents) are still mostly **stubs** and ready for implementation.

### Person 1 (DB & Data Layer)

Deliverables for P1 are effectively **done for this sprint**:

- Prisma schema designed and migrated:
  - `Account`, `Session`
  - `StudentProfile`
  - `Geofence`
  - `AttendanceRecord`
  - `AccessEvent`
  - `Incident`
- Migration history is clean and in sync.
- Seed script creates:
  - 5 accounts (4 students, 1 security),
  - profiles with RFID tags,
  - multiple geofences (gates, classrooms, parking),
  - sample attendance records,
  - sample access events (including a denied case),
  - sample incidents (if added).

The rest of the team can now build services, routes, and frontend integration against a **stable DB contract**.

***

## 2. Getting Set Up After Pull

From repo root:

```bash
cd backend/api-gateway
pnpm install         # or npm/yarn as per project
```

### 2.1 Environment

Ensure you have a local Postgres instance and a `.env` configured with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/nexus_platform?schema=public"
```

(Adjust user/password/port if your local setup is different.)

### 2.2 Migrations

Apply all migrations (schema only, no data yet):

```bash
cd backend/api-gateway
npx prisma migrate dev
```

This will:

- Apply initial auth schema (accounts + sessions).
- Apply extended schema (profiles, geofences, attendance, access, incidents).

### 2.3 Seed Data

Populate dev data:

```bash
npx prisma db seed
```

This will:

- Wipe existing data in the relevant tables.
- Insert a consistent set of dev rows:

**Accounts (examples)**

- `CS21001` — pending student (requires activation)
- `CS21002` — active student
- `CS21003` — active student
- `CS21004` — active student
- `SEC1001` — active security user

All students use a common dev password (`pass123`); security/privileged user uses a different password (`secure123`). Check `prisma/seed.ts` for exact values.

### 2.4 Inspecting Data (Optional but Recommended)

To visually inspect the DB:

```bash
npx prisma studio
```

You can then browse:

- `accounts`
- `student_profiles`
- `geofences`
- `attendance_records`
- `access_events`
- `incidents`

***

## 3. Current Prisma Models (Summary)

**Identity**

- `Account`  
  Stores login identity (email, rollNumber, hashed password, role, status, activation token).  
  Related to profile, sessions, attendance records, access events, incidents.

- `Session`  
  Device‑bound sessions (access/refresh tokens, expiry) with unique `(accountId, deviceId)` constraint.

**Profile**

- `StudentProfile`  
  One‑to‑one with `Account`. Contains first/last name and optional `rfidTag` for physical access.

**Location & Geofencing**

- `Geofence`  
  Named zones on campus:  
  - Types: e.g. `"GATE"`, `"CLASSROOM"`, `"PARKING"` (plain strings for now).  
  - `coordinates` as JSON (lat/lng) and optional `radius`.

**Attendance**

- `AttendanceRecord`  
  Links an account to a class session:  
  - `classId` (e.g. `"CS-101"`),  
  - `status` (`"PRESENT"`, `"LATE"`, `"ABSENT"` as strings),  
  - `timestamp`.

**Access**

- `AccessEvent`  
  Logs gate/zone interactions:  
  - `accountId`, `geofenceId`,  
  - `action` (`"ENTRY"`, `"EXIT"`, `"DENIED"`),  
  - optional `reason` (e.g. `"Parking entitlement missing"`),  
  - `timestamp`.

**Incidents**

- `Incident`  
  Represents security/attendance issues tied to an account:  
  - `type` (e.g. `"ACCESS_DENIED"`, `"ATTENDANCE_FAILURE"`, `"MANUAL"`),  
  - `description`,  
  - `status` (`"OPEN"`, `"RESOLVED"`, etc.),  
  - optional `assignedTo`,  
  - `createdAt`, `resolvedAt`.

> For exact field names and types, see `backend/api-gateway/prisma/schema.prisma`.

***

## 4. Seed Data Shape (For Implementers)

The seed script (`prisma/seed.ts`) currently creates:

### Accounts & Profiles

- 4 student accounts (`CS21001`–`CS21004`) with realistic names and RFID tags.
- 1 security user (`SEC1001`) with role `SECURITY`.
- Mixed statuses:
  - `CS21001` starts as `PENDING` with an `activationToken`.
  - Others are `ACTIVE`.

This is ideal for:

- Testing activation flow.
- Testing student vs security role‑based access.

### Geofences

- **Gates**
  - `Main Campus Gate`
  - `Back Campus Gate`

- **Classrooms / Labs**
  - `CS-101 Lecture Hall`
  - `CS-102 Lecture Hall`
  - `CS-103 Lab`

- **Parking**
  - `Parking Zone A`

Each has dummy `lat/lng` coordinates and a radius, ready for presence and access logic.

### Attendance Records

Roughly 5 rows, including:

- `PRESENT` and `LATE` entries for the same student.
- `ABSENT` for another student.
- Different `classId`s: `CS-101`, `CS-102`, `CS-103`.
- Timestamps spread over consecutive days.

Useful for:

- Student and admin attendance history views.
- Calculating basic percentages or trends.

### Access Events

Roughly 5 rows, including:

- Successful entries at gates and classrooms.
- At least one `DENIED` event at `Parking Zone A` with a reason such as `"Parking entitlement missing"`.
- Events tied to multiple students and multiple geofences.

Useful for:

- Access history lists.
- Incidents auto‑creation based on denied events.

### Incidents

If you added sample incidents, they will generally cover:

- At least one `ACCESS_DENIED` incident based on a denied access event.
- Possibly an `ATTENDANCE_FAILURE` or manual test incident.

***

## 5. What Each Person Can Build on Top

### Person 2 — Identity / Auth

- Auth service already uses `Account` + `Session`.
- Can add:
  - Admin student creation,
  - password reset flows,
  - richer profile fetch that joins `StudentProfile`.

### Person 3 — Attendance Service

- Use `AttendanceRecord` + `Account`.
- Implement:
  - `GET /students/:id/attendance` with real DB reads,
  - `POST /students/:id/attendance` to create records with validation,
  - stats/aggregations (percentage, per‑class breakdown).

### Person 4 — Presence & Location

- Use `Geofence` to define campus zones.
- Implement:
  - Presence service that logs positions (later: BLE/GPS),
  - a “trail” endpoint using access + future presence events,
  - `isInsideGeofence` helpers using `coordinates` + `radius`.

### Person 5 — Access Control

- Use `AccessEvent` + `Geofence` + `Account`.
- Implement:
  - Real `/access/check` logic (instead of hardcoded `allowed: true`),
  - access rules (time windows, parking entitlements),
  - write `AccessEvent` rows for each decision.

### Person 6 — Incidents & Dashboard Integration

- Use `Incident`, `AccessEvent`, `AttendanceRecord`, `Account`.
- Implement:
  - Incident CRUD endpoints,
  - auto‑creation of incidents when access is denied or attendance fails,
  - connect the web dashboard to these APIs instead of mocks.

***

## 6. Known Gaps / TODOs

Even with P1 done, a few things are intentionally left for later:

- `type`, `status`, `action` fields are currently plain strings, not enums:
  - Future improvement: promote them to Prisma enums for stronger safety.
- Seed data is dev‑oriented, not production‑like:
  - Limited number of rows; enough for MVP demos and initial development.
- No complex relations yet for:
  - Courses, timetables,
  - Parking entitlements,
  - Building hierarchies (buildings → floors → rooms).

These are out of scope for the current sprint and can be introduced incrementally.

***

## 7. If Something Breaks

Typical issues and fixes:

- **“Drift detected” or migration mismatch**  
  If you see schema drift locally (e.g., you created tables manually), run:

  ```bash
  npx prisma migrate reset
  npx prisma db seed
  ```

  This will drop and recreate your local dev DB, then reseed it.

- **Connection problems**  
  Check `DATABASE_URL` in `.env` and ensure Postgres is running and reachable.

- **Unexpected empty tables**  
  Run `npx prisma db seed` again and then inspect via `npx prisma studio`.

***

If you read this after pulling the latest `main` (or this feature branch), you can assume the **DB schema and seed are the single source of truth** for the domain. Build all new backend features and frontend integration against that.