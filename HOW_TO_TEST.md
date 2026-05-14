# HOW TO TEST — NEXUS

A complete guide for a new contributor to get NEXUS running locally and validate all implemented features.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ (20 LTS recommended) | Check with `node -v` |
| npm | 9+ | Bundled with Node |
| Docker Desktop | Latest | Used for PostgreSQL |
| Git | Any recent | For cloning |
| VS Code | Recommended | REST Client extension for `test.http` |

**VS Code Extension:** Install `humao.rest-client` to run `test.http` directly in the editor.

---

## Environment Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd Nexus
npm install          # root workspace install (installs all workspaces)
```

If workspace installs fail, install individually:
```bash
cd backend/api-gateway && npm install
cd ../../frontend/web-dashboard/campus-guardian-dashboard-main && npm install
```

### 2. Create backend `.env`

Create `backend/api-gateway/.env` with the following values:

```env
# Database — must match the Docker container below
DATABASE_URL="postgresql://nexus:nexus_dev_password@localhost:5432/nexus_dev"

# JWT — any long random string for dev
JWT_SECRET="nexus-dev-secret-change-in-production-abc123"

# Demo reset secret header (used by /dev/demo/reset)
DEMO_SECRET="nexus-demo-2026"

# Environment
NODE_ENV="development"
```

You can verify local setup with `scripts/setup-check.sh` from the repo root.

### 3. Create frontend `.env`

Create `frontend/web-dashboard/campus-guardian-dashboard-main/.env`:

```env
VITE_API_URL="http://localhost:3000"
```

---

## Start Docker PostgreSQL

```bash
docker run -d \
  --name nexus-postgres \
  -e POSTGRES_USER=nexus \
  -e POSTGRES_PASSWORD=nexus_dev_password \
  -e POSTGRES_DB=nexus_dev \
  -p 5432:5432 \
  postgres:15
```

Verify it's running:
```bash
docker ps | grep nexus-postgres
```

To stop/start later:
```bash
docker stop nexus-postgres
docker start nexus-postgres
```

---

## Run Migrations

```bash
cd backend/api-gateway
npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/` in order, including the latest `add_suspended_status` migration.

---

## Seed / Reset the Database

The demo seed is loaded via a protected HTTP endpoint (not via `prisma db seed`):

```bash
curl -X POST http://localhost:3000/dev/demo/reset \
  -H "x-demo-secret: nexus-demo-2026"
```

Or use the `test.http` request (see the Demo Reset section at the bottom of that file). You can also run `scripts/reset-demo.sh` from the repo root; it reads `DEMO_SECRET` from `backend/api-gateway/.env`.

**What the seed creates:**
- All 9 accounts (see credentials table below)
- 3 geofences (Main Campus Gate, Parking Zone, CS-103 Lab)
- CS101 course, Section A with two student groups
- Class session templates (Mon/Wed/Fri 9–10am)
- Faculty assignment: FAC1001 → Section A
- Sample attendance records and access events

**Warning:** Running demo reset deletes ALL data first.

---

## Start the Servers

### Backend

```bash
cd backend/api-gateway
npm run dev
```

Runs on `http://localhost:3000`. You should see Fastify startup logs.

### Frontend

```bash
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev
```

Runs on `http://localhost:5173` (or `8080` depending on Vite config).

---

## Seeded Accounts and Test Scenarios

| Roll Number | Email | Password | Role | Status | Use for |
|-------------|-------|----------|------|--------|---------|
| CS21001 | cs21001@campus.edu | pass123 | STUDENT | PENDING | Activation flow test |
| CS21002 | cs21002@campus.edu | pass123 | STUDENT | ACTIVE | Main student test account |
| CS21003 | cs21003@campus.edu | pass123 | STUDENT | ACTIVE | Additional student |
| CS21004 | cs21004@campus.edu | pass123 | STUDENT | ACTIVE | Late attendance seeded |
| CS21005 | cs21005@campus.edu | pass123 | STUDENT | ACTIVE | Absent attendance seeded |
| CS21006 | cs21006@campus.edu | pass123 | STUDENT | ACTIVE | Additional student |
| SEC1001 | security1@campus.edu | secure123 | SECURITY | ACTIVE | Gate/access control tests |
| ADM1001 | admin1@campus.edu | secure123 | ADMIN | ACTIVE | Admin panel, student management |
| FAC1001 | faculty1@campus.edu | secure123 | FACULTY | ACTIVE | Dr. Neha Kapoor — faculty dashboard |

---

## What to Test

### Authentication

**Student login:**
1. Open `http://localhost:5173/login`
2. Enter `CS21002` / `pass123`
3. Expected: Redirected to student dashboard with real attendance data

**Faculty login:**
1. Enter `FAC1001` / `secure123`
2. Expected: Redirected to AdminDashboard with faculty sidebar (Dashboard, Attendance, Presence Intel only)
3. Navigate to `/admin/attendance` — should show only records for Section A sessions
4. Navigate to `/admin/presence` — should show only Section A students

**Admin login:**
1. Enter `ADM1001` / `secure123`
2. Expected: AdminDashboard with full sidebar including Students, Incidents, Alerts, Activity Log
3. Stat cards should load real numbers from `/dashboard/stats`

**Pending student activation:**
1. Navigate to `http://localhost:5173/activate`
2. Enter token `activation_token_001` and any password (min 8 chars)
3. Expected: Success → redirected to `/login` (NOT auto-logged in)
4. Log in with `CS21001` and the new password

### Password Reset Flow

1. POST `/auth/password/forgot` with `{ "identifier": "cs21002@campus.edu" }`
2. Find the reset token in the **backend server console output** (not in the API response)
3. POST `/auth/password/reset` with the token and a new password
4. Expected: 200 OK. All sessions for CS21002 are invalidated.
5. Old password no longer works; new password does.

### Attendance

**Student own history:**
- Login as CS21002
- Navigate to `/attendance`
- Expected: CS21002's attendance records listed (seeded: 1 PRESENT record)

**Admin list all records:**
- Login as ADM1001
- Navigate to `/admin/attendance`
- Expected: All attendance records across all students

**Faculty scoped attendance:**
- Login as FAC1001
- Navigate to `/admin/attendance`
- Expected: Only records for Section A sessions (the seeded CS101 section)

**Faculty manual mark:**
```http
POST http://localhost:3000/attendance/faculty/mark
Authorization: Bearer <faculty_token>
Content-Type: application/json

{
  "studentAccountId": "<CS21005_uuid>",
  "classSessionTemplateId": "<template_uuid>",
  "scheduledDate": "2026-04-02",
  "status": "EXCUSED"
}
```
Expected: 201 with updated attendance record.

### Access Control

**Student own events:**
- Login as CS21002, navigate to `/access`
- Expected: CS21002's access events (seeded: allowed ENTRY at Main Campus Gate)

**Security record an entry:**
```http
POST http://localhost:3000/access/check
Authorization: Bearer <security_token>
Content-Type: application/json

{
  "accountId": "<CS21002_uuid>",
  "geofenceId": "<mainGateId>",
  "action": "ENTRY",
  "credentialType": "RFID",
  "credentialValue": "RFID_B_002"
}
```
Expected: `{ decision: "ALLOW", ... }`

### Presence Intel

**Admin overview:**
- Login as ADM1001
- Navigate to `/admin/presence`
- Expected: All students shown on map/list

**Faculty overview:**
- Login as FAC1001
- Navigate to `/admin/presence`
- Expected: Only Section A students shown

### Admin Operations

**Suspend a student (API):**
```http
PATCH http://localhost:3000/admin/students/<student_uuid>/suspend
Authorization: Bearer <admin_token>
```
Expected: `{ id, status: "suspended", message: "Account suspended" }`

**Reactivate:**
```http
PATCH http://localhost:3000/admin/students/<student_uuid>/reactivate
Authorization: Bearer <admin_token>
```
Expected: `{ id, status: "active", message: "Account reactivated" }`

### Dashboard Stats

```http
GET http://localhost:3000/dashboard/stats
Authorization: Bearer <admin_token>
```
Expected:
```json
{
  "totalStudents": 6,
  "presentToday": 0,
  "accessEventsToday": <count>,
  "activeIncidents": 0
}
```
(presentToday is 0 because seeded records are for 2026-04-02, not today.)

---

## Expected Outputs for Implemented Features

| Feature | Expected Output |
|---------|----------------|
| Login (active student) | 200, `{ accessToken, refreshToken, user: { id, rollNumber, email, role: "student" } }` |
| Login (wrong password) | 401, `{ error: { code: "INVALID_CREDENTIALS" } }` |
| Activation | 200, `{ message: "Account activated...", account: { studentId, email, status } }` — no tokens |
| `/students/me` | 200, profile of authenticated user |
| `/attendance/me` | 200, `{ data: [...], total, page, pageSize }` |
| `/attendance/records` (STUDENT) | 403 FORBIDDEN |
| `/access/me/events` | 200, paginated access events |
| `/access/check` (STUDENT) | 403 FORBIDDEN |
| `/presence/overview` (STUDENT) | 403 FORBIDDEN |
| `/dashboard/stats` (STUDENT) | 403 FORBIDDEN |
| Demo reset (no secret) | 403 FORBIDDEN |
| Demo reset (with secret) | 200, `{ success: true, message: "Demo data reset...", resetAt }` |

---

## Negative Test Cases

| Test | Expected |
|------|----------|
| Student tries `/attendance/records` | 403 |
| Student tries `/access/check` | 403 |
| Student tries `/admin/students` | 403 |
| Security tries `/attendance/faculty/mark` | 403 |
| Faculty tries `/admin/students` | 403 |
| Faculty tries `/admin/incidents` | 403 |
| Expired/invalid JWT on any protected route | 401 |
| Demo reset without `x-demo-secret` header | 403 |
| Attendance mark outside time window | 400 OUTSIDE_ATTENDANCE_WINDOW |
| Attendance mark without geofence | 400 GEOFENCE_FAILED |
| Login with PENDING account (password not yet set properly) | 401 INVALID_CREDENTIALS |

---

## Known Caveats and Limitations

1. **Activation tokens / reset tokens are console-only** — check the backend terminal for these values
2. **Seeded attendance dates are in the past** — `presentToday` in dashboard stats will be 0 unless you create new records for today's date
3. **Password reset modifies CS21002's password** — run demo reset afterward to restore it
4. **Incidents, Alerts, Activity Log** show an honest "Planned Feature" empty state — no fake data, no real backend yet
5. **BLE presence** data is stored but not used for attendance decisions
6. **Session cap** (2 web / 1 mobile) is not enforced — you can create unlimited sessions
7. **Faculty login via frontend** routes to AdminDashboard — this is correct by design

---

## Reset Test Sessions Safely

To wipe all data and restore the known-good seed state:

```bash
curl -X POST http://localhost:3000/dev/demo/reset \
  -H "x-demo-secret: nexus-demo-2026"
```

This preserves your schema but resets all accounts, sessions, attendance, and access events.

---

## Automated Tests

### Frontend Unit Tests (Vitest)

Run from `frontend/web-dashboard/campus-guardian-dashboard-main/`:

```bash
npm test          # single run
npm run test:watch  # watch mode
```

**Test files:**

| File | What it covers |
|------|---------------|
| `src/test/example.test.ts` | Baseline sanity check |
| `src/test/roleHelpers.test.ts` | `normalizeUserRole`, `isAdminRole`, `isFacultyRole`, DashboardRouter decision logic |
| `src/test/studentAlerts.test.ts` | `buildStudentAlerts` — absent/late/denied/excused record classification, sort order, priority rules |
| `src/test/tokenRefresh.test.ts` | 401 → refresh → retry cycle; token cleared on failed refresh; `setAuthToken`/`getAuthToken` round-trip; boot-time 401 handling |

All 28 tests pass as of 2026-05-08.

### Manual Tests

1. **`test.http`** — at repo root, run with VS Code REST Client extension
2. **Manual browser testing** — described above

### Type Checking

```bash
# Backend
cd backend/api-gateway && npx tsc --noEmit

# Frontend
cd frontend/web-dashboard/campus-guardian-dashboard-main && npx tsc --noEmit
```

### What is still untested (next priorities)

- Full React component renders (React Testing Library) — login flow, protected routes, 403 handling
- Faculty-scoped attendance and presence (API-level assertions)
- Student self-service attendance/access history pages
- Backend integration tests (Fastify `.inject()` — requires adding vitest to `backend/api-gateway`)
