# Branch Differences: `ayushmaan` vs `khushi`

> Compared as of 06 April 2026. Base is the shared ancestor commit `c097597` (commit message: "ok").

---

## 1. High-Level Summary

| Dimension | `khushi` | `ayushmaan` |
|---|---|---|
| Unique commits on top of shared base | 2 | 11 |
| Net lines changed vs shared base | ~+500 | ~+3 800 |
| Primary focus | In-memory Presence / Location Service | Access control decisions, full Attendance service, richer schema, auth extensions |
| Legacy backend folder (`backend/services/presence-service/`) | Present | Removed |
| Prisma schema size | 131 lines | 293 lines |

---

## 2. Commits Unique to Each Branch

### `ayushmaan`-only commits (newest → oldest)
| SHA | Message |
|---|---|
| `e46d3ed` | 06-04 8pm full audit |
| `0cd9631` | finalized schema, migration and test for attendance |
| `a16e3f2` | attendance part |
| `ea7a6d8` | updates for attendance |
| `bd73577` | updated access files |
| `68aa858` | chore(seed): normalize access events and add deny scenarios |
| `985f693` | feat(prisma): tighten access event schema with enums and geofence relation |
| `e9ee853` | updated MD file |
| `36eb328` | updated MD files |
| `1476929` | person 2 done |
| `ae8eecd` | ok |

### `khushi`-only commits
| SHA | Message |
|---|---|
| `6bae364` | test file added |
| `94038b4` | Add presence service with geofence logic |

---

## 3. Files Changed

### Files added exclusively in `ayushmaan`
| File | Description |
|---|---|
| `06-04 Noon Progress.md` | 669-line noon progress/review document |
| `AUDIT-SECURITY-FUNCTIONALITY-PROGRESS.md` | 891-line evening security/functionality audit |
| `backend/api-gateway/src/services/access-service.ts` | Full access-decision service (259 lines) |
| `backend/api-gateway/src/services/attendance-service.ts` | Full attendance service: QR mark, faculty mark, listing (395 lines) |
| `backend/api-gateway/src/routes/admin-students.ts` | Admin-only student provisioning route (99 lines) |
| `scratch.http` | Extended HTTP scratch-test file (340 lines) |
| `test.md` | Repository overview doc (105 lines) |
| `backend/api-gateway/prisma/migrations/20260406053544_add_password_reset_fields/migration.sql` | Adds `resetToken` / `resetTokenExpiresAt` columns (12 lines) |
| `backend/api-gateway/prisma/migrations/20260406090309_tighten_access_events/migration.sql` | Enum-backed access events, geofence FK (80 lines) |

### Files added exclusively in `khushi`
| File | Description |
|---|---|
| `backend/api-gateway/src/services/presence/controller.ts` | Fastify route handlers for location endpoints |
| `backend/api-gateway/src/services/presence/index.ts` | Module re-export barrel |
| `backend/api-gateway/src/services/presence/model.ts` | In-memory `PresenceStore` + TypeScript interfaces |
| `backend/api-gateway/src/services/presence/routes.ts` | Additional presence route definitions |
| `backend/api-gateway/src/services/presence/service.ts` | `PresenceService` business logic |
| `backend/api-gateway/src/services/presence/utils.ts` | Haversine distance + sample geofences |
| `test.txt` | Small binary test file ("hello") |

### Files removed in `ayushmaan` (still present in `khushi`)
| File | Reason |
|---|---|
| `backend/README.md` | Removed; replaced by `test.md` overview |
| `backend/index.js` | Old Express entry-point removed |
| `backend/package.json` | Legacy backend package removed |
| `backend/services/presence-service/*.js` (8 files) | Old standalone Node/Express presence microservice removed |
| `backend/api-gateway/src/routes/presence.ts` | Presence route removed (service deleted) |
| `backend/api-gateway/src/services/presence/*` | Entire in-memory TypeScript presence module removed |

---

## 4. Detailed Functional Differences

### 4.1 Presence Service

**`khushi`** introduces a complete, self-contained, in-memory presence/location service:
- `PresenceStore` stores GPS locations and BLE detections per userId in memory.
- `PresenceService` wraps the store and exposes `updateLocation`, `getCurrentLocation`, `getLocationHistory`, `batchUploadLocations`, `storeBLEDetection`, `checkGeofence`.
- `PresenceController` provides Fastify handlers for: `POST /presence/update-location`, `GET /presence/current/:userId`, `GET /presence/history/:userId`, `POST /presence/batch-upload`, `POST /presence/ble`, `GET /presence/ble/logs`, `POST /presence/geofence/check`.
- Haversine-based geofence check using hard-coded sample campus coordinates.
- **No database persistence** — all data lives in process memory.
- The legacy `backend/services/presence-service/` (plain JavaScript, Express) also still exists.

**`ayushmaan`** has **deleted** all presence service code (both TypeScript and legacy JavaScript). No presence/location endpoints exist. The `Geofence` model remains in the schema but is used only as a foreign key on `AccessEvent`.

---

### 4.2 Access Control

**`khushi`** has only the skeleton presence route and placeholder attendance route for access; no dedicated access decision logic.

**`ayushmaan`** adds a fully implemented `AccessService` (`src/services/access-service.ts`):
- `checkAccess(input)` resolves the access decision to `ALLOW` or `DENY`.
- Denial reasons: `OUT_OF_HOURS`, `INVALID_RFID`, `INACTIVE_ACCOUNT`, `UNAUTHORIZED_AREA`, `UNKNOWN_GEOFENCE`.
- Escalation logic: counts denials in a rolling 1-hour window; triggers `shouldEscalate = true` after 3 denials.
- Every check persists an `AccessEvent` row via Prisma with the enum `AccessAction` (`ENTRY`, `EXIT`, `DENIED`) and `AccessReason`.
- New route endpoints (in `access.ts`): `POST /access/check`, `GET /access/me/events`, `GET /access/events` (admin), `GET /access/students/:studentId/events` (admin).

---

### 4.3 Attendance Service

**`khushi`** has only a placeholder `GET /students/:studentId/attendance` route that returns an empty list.

**`ayushmaan`** replaces it with a complete `AttendanceService` and updated `attendance.ts` routes:
- **Student self-mark** (`POST /attendance/mark`): validates QR token freshness (45-second TTL), determines `PRESENT`/`LATE` based on configurable windows (10 min / 30 min after class start), writes an `AttendanceRecord`.
- **Faculty manual mark** (`POST /attendance/faculty/mark`): FACULTY/ADMIN only; allows setting any `AttendanceStatus` for a student.
- **Student history** (`GET /attendance/me`): returns paginated attendance for the authenticated account.
- **Session summary** (`GET /attendance/sessions/:id/summary`): FACULTY/ADMIN; returns present/absent/late counts for a session.
- **Admin full list** (`GET /attendance/records`): admin paginated and filtered attendance list.
- Service uses Prisma `AttendanceRecord` with `AttendanceStatus` (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) and `AttendanceMethod` (`QR`, `BLE`, `MANUAL`, `GEOFENCE`) enums.

---

### 4.4 Prisma Schema

`ayushmaan` significantly expands the schema (131 → 293 lines):

| Addition | Details |
|---|---|
| `FACULTY` role | Added to `UserRole` enum |
| `AccessAction` enum | `ENTRY`, `EXIT`, `DENIED` |
| `AccessReason` enum | 5 denial reasons |
| `AttendanceStatus` enum | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` |
| `AttendanceMethod` enum | `QR`, `BLE`, `MANUAL`, `GEOFENCE` |
| `FacultyProfile` model | Faculty-specific profile (name, department, designation) |
| `ClassSessionTemplate` model | Course, section, room, day-of-week, time slot |
| `FacultyAssignment` model | Links faculty account to a `ClassSessionTemplate` |
| `StudentGroup` + `StudentGroupMembership` models | Group-based roll call |
| `resetToken` / `resetTokenExpiresAt` on `Account` | Password reset fields |
| Extra migrations | `20260406053544` and `20260406090309` |

`khushi` schema has none of these additions.

---

### 4.5 Auth Plugin & Auth Store

**`ayushmaan`** adds two new auth endpoints and supporting store methods:

| Addition | Detail |
|---|---|
| `POST /auth/password/forgot` | Generates a `crypto.randomBytes(32)` reset token, persists via `store.setResetToken()`, logs token to console (dev only — token also returned in response body; security risk) |
| `POST /auth/password/reset` | Validates reset token via `store.getAccountByResetToken()`, calls `store.resetPassword()`, invalidates existing sessions |
| Session expiry changed | `khushi`: 15 minutes · `ayushmaan`: 7 days |
| `PrismaAuthStore.setResetToken()` | New method |
| `PrismaAuthStore.getAccountByResetToken()` | New method |
| `PrismaAuthStore.resetPassword()` | New method |

---

### 4.6 Seed Data

**`ayushmaan`** significantly expands `prisma/seed.ts` (116 → 316 lines):
- Seeds geofences, class session templates, faculty assignments, student groups.
- Seeds a mix of `ENTRY`, `EXIT`, and `DENIED` access events with reasons.
- Seeds attendance records across `PRESENT`, `LATE`, and `ABSENT` statuses.

**`khushi`** seed is simpler, covering only accounts, sessions, profiles, and basic access/attendance rows.

---

### 4.7 Documentation & Scratch Files

| File | Present in `khushi` | Present in `ayushmaan` |
|---|---|---|
| `backend/README.md` | ✅ | ❌ removed |
| `test.md` (repo overview) | ❌ | ✅ added |
| `06-04 Noon Progress.md` | ❌ | ✅ added |
| `AUDIT-SECURITY-FUNCTIONALITY-PROGRESS.md` | ❌ | ✅ added |
| `scratch.http` | ❌ | ✅ added |
| `test.http` (extended) | Partial (32 lines) | Full (389 lines) |
| `test.txt` | ✅ (binary "hello") | ❌ removed |

---

## 5. What `khushi` Has That `ayushmaan` Does Not

1. **In-memory Presence/Location Service** — complete GPS tracking, BLE detection, geofence check, batch upload, all backed by an in-memory store. Useful for rapid integration testing without a database.
2. **Legacy Express presence microservice** (`backend/services/presence-service/`) — JavaScript-based standalone service with the same feature set.
3. **`backend/README.md`** — top-level backend documentation file.

## 6. What `ayushmaan` Has That `khushi` Does Not

1. **Real access-decision logic** — `AccessService` with deny reasons, escalation threshold, and Prisma persistence.
2. **Real attendance marking flow** — QR token expiry, present/late window, faculty manual mark, session summaries.
3. **Significantly richer schema** — FACULTY role, timetable models, faculty assignments, student groups, password-reset fields, access/attendance enums.
4. **Password reset flow** — `/auth/password/forgot` and `/auth/password/reset` endpoints with token generation and invalidation.
5. **Admin student provisioning route** (`admin-students.ts`).
6. **Two additional Prisma migrations**.
7. **Extended seed** covering all new models.
8. **Comprehensive progress/audit docs** and extended HTTP test files.

---

## 7. Compatibility / Merge Considerations

- The branches **diverge on the presence layer**: merging would require deciding whether to keep the in-memory presence service from `khushi` or accept its removal in `ayushmaan`.
- **Schema conflict**: `ayushmaan` adds many models; `khushi`'s schema is the older, smaller version. A merge would need the `ayushmaan` schema as the base.
- **Session expiry conflict**: 7 days (`ayushmaan`) vs 15 minutes (`khushi`) — needs an explicit product decision.
- **`backend/README.md`**: removed in `ayushmaan`, present in `khushi` — trivially resolvable.
- The `test.http` file has diverged significantly; manual merge or choosing one version is needed.
