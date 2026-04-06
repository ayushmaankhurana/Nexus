# AUDIT-SECURITY-FUNCTIONALITY-PROGRESS

## 1. Overview

### 1.1 Repository Summary

NEXUS is a monorepo centered on a Fastify + Prisma API gateway and a React + Vite web dashboard. The current implementation has a real identity/authentication spine, a real PostgreSQL/Prisma schema, and partial backend domain logic for attendance and access. The frontend has real auth integration, but most dashboard data remains mock-backed.

### 1.2 Tech Stack Observed

- Backend: Fastify, TypeScript, Zod, Prisma ORM, PostgreSQL, bcrypt, @fastify/jwt
- Frontend: React 18, Vite, React Router, TanStack Query, Radix UI, Tailwind, shadcn/ui
- Infra: Docker Compose for PostgreSQL only
- Monorepo: npm workspaces (`backend/core`, `backend/api-gateway`)

### 1.3 Where Critical Concerns Live

- Auth and sessions: `backend/api-gateway/src/plugins/auth.ts`, `backend/api-gateway/src/services/auth-service.ts`, `backend/api-gateway/src/stores/prisma-auth-store.ts`
- Route protection and global error handling: `backend/api-gateway/src/app.ts`
- Database model and cascade behavior: `backend/api-gateway/prisma/schema.prisma`
- Frontend auth/session storage: `frontend/web-dashboard/campus-guardian-dashboard-main/src/contexts/AuthContext.tsx`, `frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts`, `frontend/web-dashboard/campus-guardian-dashboard-main/src/services/apiClient.ts`
- Mock-vs-real data boundary: `frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts` and multiple dashboard pages under `src/pages`

### 1.4 Overall Assessment

This repo is beyond prototype stage for authentication, account provisioning, schema design, and basic protected route structure. It is not yet coherent as a full campus intelligence product because:

- security-sensitive dev shortcuts are still present in live code paths
- frontend/backend contracts drift in multiple places
- several domain areas are still placeholder or mock-only
- the newly expanded Prisma attendance/timetable work is not yet reflected cleanly in generated/build state

My overall implementation progress estimate for the intended product scope is **43%**.

Reasoning:

- Identity/auth/account lifecycle: mostly real and usable
- Access control: partially real, but still v0 rules
- Attendance/timetable/faculty: meaningful schema and service work exists, but not yet fully stabilized end-to-end
- Presence/incidents/alerts/realtime/ingestion/mobile: largely planned or stubbed
- Frontend dashboards: broad UI coverage, low backend integration depth

## 2. Security Audit

### 2.1 Authentication & Sessions

#### Finding S1 — HIGH — Logout and device-switch endpoints are not JWT-protected

Both endpoints accept caller-supplied `studentId` values and do not use `onRequest: [fastify.authenticate]` or explicit `request.jwtVerify()` before acting.

```ts
// backend/api-gateway/src/plugins/auth.ts:203-227
fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = LogoutRequestSchema.parse(request.body);
    await fastify.authService.logout(body.studentId, body.deviceId);

    return reply.code(200).send({
      message: 'Logged out successfully',
    });
  } catch (error) {
    return handleError(reply, error);
  }
});

fastify.post(
  '/auth/device/switch',
  async (request: FastifyRequest, reply: FastifyReply) => {
```

Why this is a problem:

- Any unauthenticated caller can attempt to log out another account if they know or guess a `studentId` and `deviceId` pair.
- Any unauthenticated caller can attempt a device switch on another account.
- The service layer checks existence/state, but not caller identity.

Incremental remediation:

- Add `onRequest: [fastify.authenticate]` to both routes.
- Derive `studentId` from `request.user.sub` instead of trusting the request body.
- Keep only `deviceId` / `oldDeviceId` / `newDeviceId` in the body.

#### Finding S2 — MEDIUM — Access tokens are short-lived, but refresh handling is incomplete on the frontend

The backend issues 15-minute access tokens and 7-day refresh tokens, storing sessions in Postgres.

```ts
// backend/api-gateway/src/services/auth-service.ts:189-194
const payload = { sub: account.studentId, deviceId, role: account.role };
const accessToken = this.signJwt(payload, '15m');
const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');
```

```ts
// backend/api-gateway/src/stores/prisma-auth-store.ts:108-117
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const session = await this.prisma.session.create({
  data: {
    accountId: studentId,
    deviceId,
    accessToken,
    refreshToken,
    expiresAt,
  },
});
```

But the frontend does not implement automatic refresh; on any 401 it clears local state and redirects to `/login`.

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/apiClient.ts:55-59
if (response.status === 401) {
  setAuthToken(null);
  localStorage.removeItem("nexus_user");
  window.location.href = "/login";
}
```

Why this is a problem:

- Session UX is brittle despite having refresh infrastructure.
- Users will be forced to reauthenticate after access-token expiry even though a valid refresh token exists.

Incremental remediation:

- Add a centralized refresh flow in `apiClient.ts` that retries one failed request after calling `/auth/refresh`.
- Persist refresh token separately from the access token and rotate it on successful refresh.

#### Finding S3 — LOW — Role logging leaks unnecessary internal auth state

```ts
// backend/api-gateway/src/services/auth-service.ts:172
console.log("DATABASE HANDED ME THIS ROLE:", account.role);
```

Why this is a problem:

- It is unnecessary production log noise.
- It can leak internal auth details into logs or CI output.

Incremental remediation:

- Remove the log entirely.
- If role diagnostics are needed, use structured debug-level logging behind a dev flag.

### 2.2 Authorization & Roles

#### Finding S4 — HIGH — Role casing is inconsistent; some protected routes likely mis-handle admin users

Auth tokens carry uppercase role values from Prisma (`STUDENT`, `ADMIN`, `SECURITY`, `FACULTY`), and some routes correctly normalize or compare uppercase. Others compare lowercase `'admin'` directly.

```ts
// backend/api-gateway/src/services/auth-service.ts:189
const payload = { sub: account.studentId, deviceId, role: account.role };
```

```ts
// backend/api-gateway/src/routes/presence.ts:11-18
if (user.sub !== studentId && user.role !== 'admin') {
  return reply.code(403).send({
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    },
  });
}
```

```ts
// backend/api-gateway/src/routes/incidents.ts:7-15
let incidents: any[] = [];
if (user.role === 'admin') {
  // Return all incidents
  incidents = [];
} else {
  // Return incidents for the authenticated user
  incidents = [];
}
```

Why this is a problem:

- An actual `ADMIN` token may fail checks written as `user.role === 'admin'`.
- Behavior differs route-to-route, which is high risk for authorization drift.

Incremental remediation:

- Introduce a single backend helper for role checks, e.g. `hasRole(user.role, ['ADMIN'])`, and use it everywhere.
- Normalize JWT role casing at the boundary once and keep it consistent throughout the backend.

#### Finding S5 — MEDIUM — Frontend role model excludes FACULTY entirely

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/types/index.ts:1
export type UserRole = "student" | "admin" | "security";
```

```tsx
// frontend/web-dashboard/campus-guardian-dashboard-main/src/App.tsx:61-67
<Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminStudents /></ProtectedRoute>} />
<Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminAttendance /></ProtectedRoute>} />
<Route path="/admin/access" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminAccess /></ProtectedRoute>} />
<Route path="/admin/incidents" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminIncidents /></ProtectedRoute>} />
<Route path="/admin/presence" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminPresence /></ProtectedRoute>} />
<Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminAlerts /></ProtectedRoute>} />
<Route path="/admin/activity" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminActivity /></ProtectedRoute>} />
```

Why this is a problem:

- Backend and Prisma already include `FACULTY`; the frontend type system and routing do not.
- A faculty login can authenticate but has no proper route treatment or authorized UI path.

Incremental remediation:

- Extend frontend `UserRole` to include `faculty`.
- Decide whether faculty gets its own route set or shares parts of admin attendance views.
- Normalize backend uppercase roles to frontend lowercase roles in one place.

#### Finding S6 — MEDIUM — Frontend trusts localStorage to hydrate authenticated state without validating token freshness

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/contexts/AuthContext.tsx:28-34
const token = getAuthToken();
const savedUser = localStorage.getItem("nexus_user");
if (token && savedUser) {
  try {
    const user = JSON.parse(savedUser) as User;
    setState({ user, session: null, isAuthenticated: true, isLoading: false });
```

Why this is a problem:

- The app boots into an authenticated state entirely from local storage.
- Expired or tampered local session data is only corrected after the next API call fails.

Incremental remediation:

- On app boot, call a lightweight authenticated endpoint such as `/students/me` before marking the session authenticated.
- Alternatively decode the JWT client-side to pre-check expiry and role shape.

### 2.3 Sensitive Data

#### Finding S7 — HIGH — Reset tokens are logged and returned in API responses

```ts
// backend/api-gateway/src/plugins/auth.ts:251-263
const resetToken = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

await store.setResetToken(account.studentId, resetToken, expiresAt);

console.log(`\n PASSWORD RESET TOKEN for ${account.email}:`);
console.log(` Token: ${resetToken}`);
console.log(` Expires: ${expiresAt.toISOString()}\n`);

return reply.code(200).send({
  message: 'If an account exists for this identifier, a reset token has been generated.',
  resetToken, // DEV ONLY — remove before production
});
```

Why this is a problem:

- Reset tokens are high-sensitivity credentials.
- Returning them in the response collapses the email/reset-channel security model.
- Logging them increases accidental exposure risk in logs and terminal history.

Incremental remediation:

- Remove `resetToken` from the response body.
- Remove token logging.
- If local dev visibility is needed, guard it behind an explicit env flag like `EXPOSE_DEV_TOKENS=true` and nest under a `devOnly` field.

#### Finding S8 — HIGH — Activation tokens are returned from the admin create-student endpoint

```ts
// backend/api-gateway/src/routes/admin-students.ts:36-54
const activationToken = crypto.randomBytes(32).toString('hex');

const created = await store.createStudentAccount({
  rollNumber: body.rollNumber,
  email: body.email,
  firstName: body.firstName,
  lastName: body.lastName,
  rfidTag: body.rfidTag,
  activationToken,
});

return reply.code(201).send({
  id: created.studentId,
  rollNumber: created.rollNumber,
  email: created.email,
  role: created.role,
  status: created.status,
  profile: created.profile,
  activationToken: created.activationToken,
});
```

Why this is a problem:

- Activation tokens are sensitive onboarding secrets.
- Any admin consumer or frontend could persist or leak them.
- The route currently acts as both account provisioning and token disclosure.

Incremental remediation:

- Return only a provisioning status plus account metadata.
- Deliver activation tokens through a separate channel or dev-only flag.
- If tokens must be exposed for local testing, gate them by environment and mark clearly as dev-only.

#### Finding S9 — HIGH — Real credentials and secrets are checked into the repository

```env
# backend/api-gateway/.env:15-17
DATABASE_URL="postgresql://nexus_admin:nexus_secure_password_2026@localhost:5432/nexus_platform?schema=public"
JWT_SECRET="e870cc586714d6e88c9dc5b1999b2790fd88f3ddf3d20a705d66100551af3200"
```

```yaml
# docker-compose.yml:7-10
environment:
  - POSTGRES_USER=nexus_admin
  - POSTGRES_PASSWORD=nexus_secure_password_2026
  - POSTGRES_DB=nexus_platform
```

Why this is a problem:

- Secrets are versioned and visible to every clone.
- Even if these are dev-only, they train insecure patterns and can get reused inappropriately.

Incremental remediation:

- Remove committed `.env` files containing real values.
- Add `.env.example` with placeholders only.
- Move docker-compose credentials to environment substitution or local overrides.

#### Finding S10 — LOW — Password hashing is acceptable, but the work factor is static and not configurable

The repo uses bcrypt with a cost factor of 10.

```ts
// backend/api-gateway/src/stores/prisma-auth-store.ts:179-181
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
```

Why this is a problem:

- `10` is serviceable for development and small deployments, but not adjustable per environment.

Incremental remediation:

- Move bcrypt cost to config with a secure default.
- Keep dev lower if necessary, higher in production.

### 2.4 Input Validation & Error Handling

#### Finding S11 — MEDIUM — Validation exists on many boundaries, but error shapes are not fully consistent with frontend expectations

Backend errors typically return `{ error: { code, message } }`, while the frontend `ApiHttpError` expects a flatter `ApiError` shape.

```ts
// backend/api-gateway/src/app.ts:50-55
return reply.status(error.statusCode).send({
  error: {
    code: (error as any).code || 'ERROR',
    message: error.message,
  },
});
```

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/apiClient.ts:42-50
try {
  errorBody = await response.json();
} catch {
  errorBody = { message: response.statusText, status: response.status };
}
...
throw new ApiHttpError(errorBody, response.status);
```

Why this is a problem:

- If the backend returns `{ error: { ... } }`, the frontend constructor reads `message` from the wrong level.
- User-facing error messages may degrade to generic or missing text.

Incremental remediation:

- Standardize backend error envelopes and unwrap them in `handleResponse()`.
- Example: if response JSON has `error`, pass `errorBody.error` into `ApiHttpError`.

### 2.5 Database Layer

#### Finding S12 — MEDIUM — Critical domain fields are still strings instead of enums or constrained foreign keys

```prisma
// backend/api-gateway/prisma/schema.prisma:220-244
model Geofence {
  name             String @unique
  type             String
  coordinates      Json
  radius           Float?
  isActive         Boolean @default(true)
}

model Incident {
  type        String
  description String
  status      String @default("OPEN")
  assignedTo  String?
}
```

Why this is a problem:

- `Geofence.type`, `Incident.type`, and `Incident.status` are not schema-constrained.
- Inconsistent strings are likely over time, especially once more services are added.

Incremental remediation:

- Introduce Prisma enums for geofence type and incident status/type.
- Add relations where ownership/assignment becomes real.

#### Finding S13 — LOW — Cascade behavior is mostly reasonable, but some ownership/audit links are still weak

```prisma
// backend/api-gateway/prisma/schema.prisma:196-216
model AttendanceRecord {
  accountId              String
  classSessionTemplateId String
  ...
  account              Account              @relation(fields: [accountId], references: [id], onDelete: Cascade)
  classSessionTemplate ClassSessionTemplate @relation(fields: [classSessionTemplateId], references: [id], onDelete: Restrict)
}
```

This is mostly sensible, but important audit-style links such as `markedByFacultyId` are not yet modeled as relations.

Why this matters:

- Faculty attribution exists as a raw string, not referential integrity.
- Audit trails will be weaker once faculty lifecycle operations are added.

Incremental remediation:

- Add a relation for `markedByFacultyId` to `Account` once faculty workflows stabilize.

## 3. Functionality Audit

### 3.1 Backend

#### 3.1.1 Auth Flows

Working:

- `POST /auth/login` is real and Prisma-backed.
- `POST /auth/activate` is real and sets the password with bcrypt.
- `POST /auth/refresh` is implemented and rotates tokens.
- `POST /auth/logout` and `POST /auth/device/switch` work functionally.
- Forgot-password and reset-password are implemented.

Representative snippet:

```ts
// backend/api-gateway/src/plugins/auth.ts:167-188
fastify.post('/auth/activate', async (request: FastifyRequest, reply: FastifyReply) => {
  ...
});

fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
  ...
});
```

Gaps / inconsistencies:

- logout and device switch are not protected by JWT despite being account-mutating
- forgot-password returns the token directly
- auth route handling duplicates error handling instead of using a thinner route layer

#### 3.1.2 Identity Spine

Working:

- `Account`, `Session`, `StudentProfile`, `FacultyProfile`, `StudentGroup*`, `Section`, `Course`, and `ClassSessionTemplate` are now present in Prisma.
- Sessions are persisted and device-bound.
- Roles now include `FACULTY` in Prisma.

Representative snippet:

```prisma
// backend/api-gateway/prisma/schema.prisma:43-66
model Account {
  id                  String        @id @default(uuid())
  rollNumber          String        @unique
  email               String        @unique
  password            String
  role                UserRole      @default(STUDENT)
  status              AccountStatus @default(PENDING)
  activationToken     String?       @unique
  resetToken          String?       @unique
  resetTokenExpiresAt DateTime?
  ...
}
```

Gaps / inconsistencies:

- `backend/core/src/types/index.ts` still carries an older `User` role shape (`student | security | admin`) while `StudentAccount` uses uppercase Prisma-style roles.
- Cross-layer role normalization remains ad hoc.

#### 3.1.3 Attendance / Timetable / Faculty

What is implemented:

- New attendance routes exist:
  - `POST /attendance/mark`
  - `POST /attendance/faculty/mark`
  - `GET /attendance/me`
  - `GET /attendance/sessions/:id/summary`
  - `GET /attendance/records`
- Attendance service implements QR expiry, geofence gate, schedule windowing, faculty manual mark, and summary queries.
- Prisma schema now includes timetable/faculty primitives.

```ts
// backend/api-gateway/src/routes/attendance.ts:76-161
'/attendance/mark'
'/attendance/faculty/mark'
'/attendance/me'
'/attendance/sessions/:id/summary'
'/attendance/records'
```

```ts
// backend/api-gateway/src/services/attendance-service.ts:104-177
const qrAgeSeconds = (now.getTime() - input.qrIssuedAt) / 1000;
...
if (!input.geofenceValidated) {
  throw new AppError('GEOFENCE_FAILED', 400, 'You must be within the classroom geofence to mark attendance.');
}
...
const enrolled = await this.prisma.studentGroupMembership.findFirst({
  where: {
    accountId: input.studentAccountId,
    group: { sectionId: template.sectionId },
  },
});
```

Current reality check:

- Editor/build state still shows Prisma-generated client mismatch around the new attendance schema.
- The implementation is meaningful, but not yet fully stabilized as a clean build artifact.

#### 3.1.4 Access Control

What is implemented:

- `POST /access/check` is real and role-protected for admin/security.
- `GET /access/me/events`, `GET /access/events`, and legacy `GET /access/:studentId` are implemented.
- Access service records real `AccessEvent` rows and applies basic v0 denial rules.

```ts
// backend/api-gateway/src/routes/access.ts:47-119
'/access/check'
'/access/me/events'
'/access/events'
'/access/:studentId'
```

```ts
// backend/api-gateway/src/services/access-service.ts:117-138
if (account.status !== AccountStatus.ACTIVE) {
  finalAction = AccessAction.DENIED;
  finalReason = AccessReason.INACTIVE_ACCOUNT;
}
...
if (!finalReason && geofence.type === 'PARKING' && account.role === 'STUDENT') {
  finalAction = AccessAction.DENIED;
  finalReason = AccessReason.UNAUTHORIZED_AREA;
}
```

Gaps:

- Policy logic is still simplistic and hardcoded.
- No richer access rule model, schedules, or entitlements exist yet.

#### 3.1.5 Presence

Status: mostly stubbed.

```ts
// backend/api-gateway/src/routes/presence.ts:7-38
return {
  studentId,
  isPresent: false,
  lastSeen: null,
};
...
return {
  studentId,
  trail: [],
};
```

What works:

- Endpoints exist and require authentication.
- Ownership checks are attempted.

What is missing:

- No presence model in the DB.
- No ingestion path, no signal fusion, no trail reconstruction.
- Role checks are casing-buggy.

#### 3.1.6 Incidents

Status: placeholder route layer only.

```ts
// backend/api-gateway/src/routes/incidents.ts:3-25
let incidents: any[] = [];
if (user.role === 'admin') {
  incidents = [];
} else {
  incidents = [];
}

return { incidents };
```

What works:

- Endpoints exist and require authentication.

What is missing:

- No DB-backed incident service.
- No lifecycle updates, assignment, filtering, or alert linkage.
- Role logic is incomplete and casing-sensitive.

#### 3.1.7 Error Envelope Behavior

Working:

- App-level handler returns structured JSON consistently enough for backend clients.

Gaps:

- Frontend unwrapping does not match the envelope shape.
- Some route modules still return hand-built error objects instead of central helpers.

### 3.2 Frontend

#### 3.2.1 Auth Flows and Session Handling

What works:

- Login uses the real backend.
- Activation uses the real backend.
- Logout and device switch call real backend endpoints.
- Token and user are persisted in localStorage.

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts:61-67
const res = await apiPost<AuthResponse>("/auth/login", {
  identifier,
  password,
  deviceId,
});
```

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts:84-87
const res = await apiPost<AuthResponse>("/auth/activate", {
  activationToken,
  password,
});
```

Gaps:

- No automatic refresh flow despite backend support.
- Session hydration trusts localStorage before verification.
- Device IDs are browser-generated and stored client-side without stronger device identity.

#### 3.2.2 Route Guards and Role-Based Navigation

What works:

- `ProtectedRoute` guards unauthenticated access.
- Student and admin/security routes are separated in `App.tsx`.

What is missing or inconsistent:

- No faculty route handling.
- Frontend role model is lowercase and incomplete.
- Dashboard routing treats security as admin, which may be acceptable, but it is implicit rather than policy-driven.

#### 3.2.3 Real Backend Calls vs. Mock Data

Auth is real. Most domain pages are still mock-backed.

Examples of direct mock imports in pages:

```tsx
// frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentAttendance.tsx:6
import { mockAttendanceSummary, mockAttendanceRecords } from "@/mocks/data";
```

```tsx
// frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminAccess.tsx:6
import { mockAccessEvents, mockAccessRequests } from "@/mocks/data";
```

```tsx
// frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminDashboard.tsx:10
import { mockStudents, mockAlerts, mockIncidents, mockAccessEvents, mockAttendanceRecords, mockActivityEvents } from "@/mocks/data";
```

The shared data API also confirms that most domain reads/writes are forced into mock mode:

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts:1-6
import * as mock from "@/mocks/data";

const USE_MOCK = true;
```

Impact:

- The frontend can demo screens, but not validate most backend functionality.
- Admin and student dashboards present a more complete product than the backend currently supplies.

#### 3.2.4 Frontend/Backend Contract Drift

Several frontend service paths do not match the current backend routes even if mock mode were turned off.

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts:17-23
return apiGet(`/students/${id}`);
...
return apiGet(`/students/${id}/activity`);
```

Backend currently exposes `GET /students/:studentId/profile`, not `GET /students/:id`.

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts:44-49
return apiGet("/access", params);
...
return apiGet("/access/me");
```

Backend exposes `/access/events` and `/access/me/events`, not `/access` or `/access/me`.

```ts
// frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts:105-114
return apiGet("/presence");
...
return apiGet(`/presence/${studentId}/trace`);
```

Backend exposes `/presence/:studentId` and `/presence/:studentId/trail`, not `/presence` or `/trace`.

Consequence:

- Turning `USE_MOCK` off in `dataApi.ts` would break many screens immediately.

## 4. Progress & Roadmap

### 4.1 Progress Estimate

**Estimated progress: 43%**

Reasoning by area:

- Auth and identity: 75-80%
- Access v0: 50-60%
- Attendance/timetable/faculty: 45-50% conceptually, lower operationally until build/client generation is clean
- Presence: 15%
- Incidents/alerts: 15-20%
- Frontend auth UX: 70%
- Frontend domain integration: 20-25%
- Realtime/ingestion/mobile/reliability: 0-10%

### 4.2 COMPLETED (or Essentially Complete)

- **Prisma-backed identity and session model**
  - `Account`, `Session`, and `StudentProfile` are real and wired to login/session flows.
  - Key files: `backend/api-gateway/prisma/schema.prisma`, `backend/api-gateway/src/stores/prisma-auth-store.ts`

- **Core auth flows**
  - Login, activation, refresh, logout, device switch, forgot-password, and reset-password all exist and are Prisma-backed.
  - Key files: `backend/api-gateway/src/plugins/auth.ts`, `backend/api-gateway/src/services/auth-service.ts`

- **Basic route protection framework**
  - Fastify JWT plugin and authenticated route pattern are in place.
  - Key files: `backend/api-gateway/src/app.ts`, `backend/api-gateway/src/routes/*`

- **Admin student provisioning path**
  - Admin can create pending student accounts with generated activation tokens.
  - Key file: `backend/api-gateway/src/routes/admin-students.ts`

- **Frontend auth integration**
  - Login, activation, local token persistence, and route guards are wired to the backend.
  - Key files: `frontend/.../src/services/authApi.ts`, `frontend/.../src/contexts/AuthContext.tsx`

### 4.3 IN PROGRESS

- **Attendance / timetable / faculty backend**
  - Done: Prisma schema expansion, attendance service, attendance route set, seed data.
  - Missing: clean generated Prisma client/build state, frontend wiring, stronger faculty UX and role integration.
  - Key files: `backend/api-gateway/prisma/schema.prisma`, `backend/api-gateway/src/services/attendance-service.ts`, `backend/api-gateway/src/routes/attendance.ts`

- **Access control backend v0**
  - Done: event recording, simple deny rules, admin/security routes.
  - Missing: richer policy engine, entitlements, schedule-aware checks, frontend integration.
  - Key files: `backend/api-gateway/src/services/access-service.ts`, `backend/api-gateway/src/routes/access.ts`

- **Frontend-backend contract convergence**
  - Done: auth endpoints aligned; some self-service endpoints reflected in tests.
  - Missing: domain APIs and pages still mostly drift or stay mock-only.
  - Key files: `frontend/.../src/services/dataApi.ts`, `test.http`

### 4.4 NOT STARTED / TODO

- **Real presence modeling and processing**
  - No DB model or service implementation for raw presence/location events.
  - Reference intent: `backend/ingestion/README.md`, `backend/realtime/README.md`, `backend/services/presence-service/README.md`

- **Incident lifecycle automation**
  - No DB-backed incident service, alert linkage, assignment, or state transitions.
  - Reference intent: `backend/services/incident-service/README.md`, `backend/api-gateway/src/routes/incidents.ts`

- **Realtime delivery**
  - WebSocket/live update layer exists only as design intent.
  - Reference: `backend/realtime/README.md`

- **Reliability/risk scoring**
  - Present as architecture concept only.
  - Reference: `backend/services/reliability-service/README.md`

- **Mobile app implementation**
  - Placeholder only.
  - Reference: `frontend/mobile-app/README.md`

- **Full faculty UX and route set**
  - Backend schema supports faculty; frontend and route surface do not yet treat faculty as a first-class role.
  - Reference files: `backend/api-gateway/prisma/schema.prisma`, `frontend/.../src/App.tsx`, `frontend/.../src/types/index.ts`

- **Clean production-grade secret handling**
  - Current code still contains checked-in secrets and dev token disclosure.

- **Build stabilization for new Prisma schema**
  - Current editor state still reports missing generated Prisma members for the attendance/timetable models.

## 5. Recommended Next Steps

1. **Close the auth security gaps first**
   - Protect `/auth/logout` and `/auth/device/switch` with JWT.
   - Remove reset/activation token disclosure from normal API responses.
   - Remove committed secrets from source control and replace with examples.

2. **Normalize role handling end-to-end**
   - Pick one canonical role casing strategy per layer.
   - Centralize backend authorization helpers.
   - Add `faculty` to frontend types and routing.

3. **Stabilize the Prisma attendance expansion**
   - Ensure migration, client generation, and TypeScript build are in sync.
   - Only after that, treat attendance/timetable as usable rather than provisional.

4. **Fix frontend/backend contract drift before turning off mocks**
   - Align `dataApi.ts` paths to actual backend routes.
   - Migrate the most important pages first: student attendance, student access, admin access, admin attendance.

5. **Choose one integration milestone and finish it end-to-end**
   - Best candidate: attendance.
   - Backend already has the most substance there; finish build stability, wire frontend reads, and add faculty UI entry points.

6. **Treat incidents, presence, alerts, realtime, and ingestion as separate future slices**
   - They have good design intent in README files, but they are not implementation-close yet.
   - Avoid over-representing them as working product features until route/service/data layers are real.
