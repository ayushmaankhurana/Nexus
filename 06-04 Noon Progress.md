# 06-04 Noon Progress

## 1. Executive Summary

Nexus is not an end-to-end campus operations product yet. It is a solid auth-plus-schema foundation with a wide but mostly non-functional feature surface layered on top. The backend has real Prisma-backed identity, session binding, password reset, profile fetch, and single-student admin provisioning in backend/api-gateway/src/plugins/auth.ts, backend/api-gateway/src/services/auth-service.ts, backend/api-gateway/src/stores/prisma-auth-store.ts, and backend/api-gateway/prisma/schema.prisma. Outside that core, attendance, access, presence, and incidents are mostly schema-backed placeholders with route shells that return empty arrays or canned responses.

Estimated completion: about 32% overall. Backend is about 45% complete because identity and the DB contract are real, but core domain services are still missing. Frontend is about 35% complete because the dashboard UI breadth is high, but almost all business data is mock-backed. Infra is about 10% complete because realtime, ingestion, ML, and notifications are README-only. The highest-risk areas are role/casing mismatches across backend and frontend, broken activation contract between frontend and backend, missing timetable and faculty model, no real presence pipeline, and docs that still describe an older architecture.

## 2. Feature Completion Matrix

| Feature Area | Expected Capability | Current Status | Evidence | Notes / Gaps |
|---|---|---|---|---|
| Auth | Activation, login, logout, device switch, refresh, forgot/reset password, one-device session binding | Mostly | backend/api-gateway/src/plugins/auth.ts, backend/api-gateway/src/services/auth-service.ts, backend/api-gateway/src/stores/prisma-auth-store.ts, backend/api-gateway/prisma/schema.prisma | Backend flows are real. Frontend activation contract is broken, role normalization is inconsistent, and auth responses are not consistently shaped for the frontend. |
| Student profiles | Student profile storage, self profile, privileged lookup, authz | Mostly | backend/api-gateway/src/routes/students.ts, backend/api-gateway/src/stores/prisma-auth-store.ts, backend/api-gateway/prisma/schema.prisma | Read-only profile fetch exists. No profile update flow. No faculty-specific visibility model. |
| Admin onboarding | Admin-created student accounts, activation provisioning | Partial | backend/api-gateway/src/routes/admin-students.ts, backend/api-gateway/src/schemas/auth.ts, backend/api-gateway/src/stores/prisma-auth-store.ts | Single-student create only. No bulk import, resend activation, suspend, deactivate, edit, or delete. Activation token is returned in the API response. |
| Attendance | Classroom attendance with class ownership, QR/geofence validation, statuses, policies | Partial | backend/api-gateway/src/routes/attendance.ts, backend/api-gateway/prisma/schema.prisma, backend/api-gateway/prisma/seed.ts, backend/services/schedule-attendance-service/README.md | Schema and seed exist, but routes are placeholders. No timetable, class session, faculty ownership, QR issuance, geofence validation, or BLE support. |
| Access control | RFID/card-based gate and parking decisions, denied logging, escalation | Partial | backend/api-gateway/src/routes/access.ts, backend/api-gateway/prisma/schema.prisma, backend/api-gateway/prisma/seed.ts, backend/services/access-service/README.md | AccessEvent exists and seed includes denied access, but decision logic is placeholder only. No access policy model, credential model, or escalation pipeline. |
| Presence | Passive location/presence signals, trails, map/heatmap inputs, lower-confidence geofence evidence | Stub | backend/api-gateway/src/routes/presence.ts, backend/api-gateway/prisma/schema.prisma, backend/ingestion/README.md, backend/services/presence-service/README.md | There is no presence event/state model at all. Only Geofence exists. Presence routes return placeholders. |
| Incidents | CRUD, lifecycle, admin/security management, escalation | Partial | backend/api-gateway/src/routes/incidents.ts, backend/api-gateway/prisma/schema.prisma, backend/services/incident-service/README.md | Incident model exists, but routes are mock responses. No real lifecycle, assignment, audit trail, alert-to-incident flow, or admin/security-only enforcement. |
| Reliability score | Batch scoring, thresholds, admin visibility, signal aggregation | Missing | backend/services/reliability-service/README.md, backend/ml-services/README.md | No schema, no route, no job, no persistence, no threshold config. |
| Faculty | Faculty role, class-scoped attendance marking and viewing, no live location | Missing | backend/api-gateway/prisma/schema.prisma, frontend/web-dashboard/README.md, frontend/mobile-app/README.md | Faculty appears only in docs. No FACULTY role, no ownership model, no faculty UI, no faculty authz. |
| Timetable | Shared timetable/session/course model, per-student schedule access | Missing | backend/services/schedule-attendance-service/README.md, 04-04-Handoff.md, backend/api-gateway/prisma/schema.prisma | No course, timetable, class session, section, or enrollment models exist. Attendance cannot become real without this. |
| Notifications/realtime | Alerts delivery, live updates, websocket/SSE/polling | Missing | backend/realtime/README.md, backend/ml-services/README.md, frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts | No realtime code, no notification model, no alert backend, no push/polling architecture. |
| Frontend | Student/admin/security working flows against backend | Partial | frontend/web-dashboard/campus-guardian-dashboard-main/src/App.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts, frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentDashboard.tsx | Auth wiring exists, but dashboard pages mostly import mock data directly. Mobile app and shared package are README-only. |

## 3. What Is Fully Implemented

- The Prisma-backed identity core is real. backend/api-gateway/prisma/schema.prisma defines Account, Session, StudentProfile, Geofence, AttendanceRecord, AccessEvent, and Incident, and backend/api-gateway/prisma/seed.ts populates realistic dev data for accounts, geofences, attendance, and access events.
- Session binding and one-device-per-account are genuinely enforced in the backend. The DB uniqueness is in backend/api-gateway/prisma/schema.prisma, while login/device-switch behavior is implemented in backend/api-gateway/src/services/auth-service.ts and persisted in backend/api-gateway/src/stores/prisma-auth-store.ts.
- The backend auth flow is materially complete: activate, login, logout, device switch, forgot password, reset password, and refresh are all implemented in backend/api-gateway/src/plugins/auth.ts and backend/api-gateway/src/services/auth-service.ts.
- Student profile retrieval is real. backend/api-gateway/src/routes/students.ts implements student self fetch and privileged fetch for another student, backed by backend/api-gateway/src/stores/prisma-auth-store.ts.
- Single-student admin provisioning is real. backend/api-gateway/src/routes/admin-students.ts creates a pending student account plus StudentProfile using backend/api-gateway/src/stores/prisma-auth-store.ts.
- Health and API bootstrapping are real. backend/api-gateway/src/routes/health.ts and backend/api-gateway/src/app.ts register the gateway, JWT, auth middleware, and routes.

## 4. What Is Partially Implemented

- Auth is only mostly complete, not cleanly finished. The backend is real, but the frontend activation flow in frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts expects an AuthResponse with user and tokens, while the backend activation endpoint in backend/api-gateway/src/plugins/auth.ts returns message plus account. That makes frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/auth/ActivationPage.tsx very likely fail at runtime after a successful activation.
- Student profiles are read-only and backend-only. backend/api-gateway/src/routes/students.ts is usable for fetch, but there is no profile update API, no admin edit flow, and no frontend profile management beyond a disabled Edit Profile button in frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentAccount.tsx.
- Attendance has schema and sample rows, but not the product behavior. backend/api-gateway/prisma/schema.prisma and backend/api-gateway/prisma/seed.ts support storing raw records, but backend/api-gateway/src/routes/attendance.ts only returns an empty list or a success message. There is no QR generation, no faculty trigger, no geofence check, no late window logic, and no timetable anchor.
- Access control has event storage, but not decisioning. backend/api-gateway/prisma/schema.prisma and backend/api-gateway/prisma/seed.ts support storing access events, including denied events, but backend/api-gateway/src/routes/access.ts hardcodes allowed true for checks and returns empty history.
- Incidents have schema support but no working workflow. backend/api-gateway/prisma/schema.prisma has an Incident table, but backend/api-gateway/src/routes/incidents.ts only returns empty incidents or a mock created incident. There is no update endpoint, no assignee logic, and no lifecycle enforcement.
- The web dashboard is broad but shallow. Role-based route shells exist in frontend/web-dashboard/campus-guardian-dashboard-main/src/App.tsx, and auth calls are wired in frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts, but core pages such as frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentDashboard.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminDashboard.tsx, and frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminStudents.tsx import mock data directly rather than using real backend data.

## 5. What Is Only Stubbed or Scaffolded

- Attendance routes are stubs in backend/api-gateway/src/routes/attendance.ts.
- Access routes are stubs in backend/api-gateway/src/routes/access.ts.
- Presence routes are stubs in backend/api-gateway/src/routes/presence.ts.
- Incident routes are stubs in backend/api-gateway/src/routes/incidents.ts.
- The service-oriented backend folders are planning documents, not services. backend/services/access-service/README.md, backend/services/campus-service/README.md, backend/services/identity-service/README.md, backend/services/incident-service/README.md, backend/services/presence-service/README.md, backend/services/reliability-service/README.md, and backend/services/schedule-attendance-service/README.md are README-only.
- Realtime, ingestion, and ML are scaffolds only. backend/realtime/README.md, backend/ingestion/README.md, and backend/ml-services/README.md contain descriptions only.
- The mobile app and shared frontend package are not implemented. frontend/mobile-app/README.md and frontend/shared/README.md are the only contents.
- Most dashboard data is scaffolded UI with mock state. Pages across frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentAttendance.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentAccess.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentAlerts.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminAccess.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminIncidents.tsx, and frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminPresence.tsx are mock-driven.
- Test coverage is effectively absent. The only real test file found is frontend/web-dashboard/campus-guardian-dashboard-main/src/test/example.test.ts.

## 6. What Is Missing Entirely

- Faculty as a first-class role is missing. There is no FACULTY enum value in backend/api-gateway/prisma/schema.prisma, no faculty route layer in backend/api-gateway/src/routes, and no faculty UI branch in frontend/web-dashboard/campus-guardian-dashboard-main/src/App.tsx. This would likely require schema changes in backend/api-gateway/prisma/schema.prisma, new route/service modules under backend/api-gateway/src/routes and backend/services/schedule-attendance-service/README.md, and new frontend views.
- Timetable, course, section, and class-session modeling are missing. There is no shared session model anywhere in backend/api-gateway/prisma/schema.prisma. The likely implementation point is new models in that schema plus corresponding APIs in the schedule/attendance service area described by backend/services/schedule-attendance-service/README.md.
- Presence event storage is missing. Geofence exists, but there is no model for raw location, last-known area, trace, or confidence. This would need new persistence in backend/api-gateway/prisma/schema.prisma, ingestion handlers beyond backend/ingestion/README.md, and new presence APIs.
- Notification and alerts backend support are missing. The frontend has alert screens and patch methods in frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts, but there is no alert model or route in the backend. This needs schema, routes, and likely realtime infrastructure.
- Reliability scoring is missing. backend/services/reliability-service/README.md and backend/ml-services/README.md describe intent only. There is no score model, batch job, threshold config, or API.
- Admin lifecycle operations beyond create are missing. There is no bulk student import, resend activation, suspend, deactivate, delete, or update flow in backend/api-gateway/src/routes/admin-students.ts. Those would likely extend that route file, backend/api-gateway/src/schemas/auth.ts, and backend/api-gateway/src/stores/prisma-auth-store.ts.
- V1 RFID/card credential management is missing as a domain concept. RFID tags exist on StudentProfile in backend/api-gateway/prisma/schema.prisma, but there is no actual credential verification flow, no card issuance lifecycle, no parking entitlement model, and no access rule engine.

## 7. Inconsistencies / Bugs / Risky Assumptions

- Backend role casing is inconsistent with route authz. backend/api-gateway/src/services/auth-service.ts returns uppercase enum roles from login, while backend/api-gateway/src/routes/attendance.ts, backend/api-gateway/src/routes/access.ts, backend/api-gateway/src/routes/presence.ts, and backend/api-gateway/src/routes/incidents.ts compare against lowercase admin.
- Frontend route protection is incompatible with real backend roles. frontend/web-dashboard/campus-guardian-dashboard-main/src/components/layout/ProtectedRoute.tsx and frontend/web-dashboard/campus-guardian-dashboard-main/src/App.tsx allow only lowercase roles, while login returns uppercase roles from backend/api-gateway/src/services/auth-service.ts. Real logins can be authorized in the backend but still fail or misroute in the frontend.
- Activation is contract-broken across the stack. backend/api-gateway/src/plugins/auth.ts returns message plus account for activation, but frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts treats activation like login and expects tokens plus user. frontend/web-dashboard/campus-guardian-dashboard-main/src/contexts/AuthContext.tsx then tries to authenticate immediately after activation. That flow is not aligned.
- Frontend error handling does not match backend error envelopes. frontend/web-dashboard/campus-guardian-dashboard-main/src/services/apiClient.ts expects a flat message payload, but the backend returns nested error objects from backend/api-gateway/src/plugins/auth.ts and backend/api-gateway/src/app.ts. That means users may get poor or blank error messages.
- Backend CORS blocks PATCH, but the frontend uses PATCH for incidents and alerts. backend/api-gateway/src/app.ts only allows GET, POST, and OPTIONS. frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts calls PATCH for incident updates and alert status changes. Even after real endpoints exist, browsers will fail those calls until CORS is expanded.
- Presence API naming is inconsistent. The backend route is trail in backend/api-gateway/src/routes/presence.ts, while the frontend client expects trace in frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts.
- Sensitive tokens are exposed in dev APIs. backend/api-gateway/src/routes/admin-students.ts returns activationToken in the create-student response, and backend/api-gateway/src/plugins/auth.ts logs and returns password reset tokens.
- Access and incident route authorization is too loose. backend/api-gateway/src/routes/access.ts allows any authenticated caller to hit access check, and backend/api-gateway/src/routes/incidents.ts allows any authenticated caller to create incidents.
- The schema is still stringly typed in places where the product needs stronger contracts. backend/api-gateway/prisma/schema.prisma uses plain String for Geofence.type, AttendanceRecord.status, AccessEvent.action, and Incident.status. That is risky for cross-service consistency.
- The current schema is not fully relational enough for the intended product. backend/api-gateway/prisma/schema.prisma stores geofenceId on AccessEvent without a relation, which will complicate richer access/presence queries.
- The seeded attendance data already includes LATE in backend/api-gateway/prisma/seed.ts, even though the attendance policy is not finalized.
- The repo contains stale/dead artifacts. backend/api-gateway/src/routes/deprecated auth.ts, backend/api-gateway/dist/app.js, and dist/backend/api-gateway/src/routes/access.js suggest checked-in generated output and superseded code that can confuse maintainers.
- The documentation is materially out of sync. README.md still claims in-memory persistence and pre-JWT behavior in multiple places, while backend/api-gateway/API-CONTRACTS.md still marks refresh and admin student provisioning as not yet implemented even though they are live in code.

## 8. Unresolved Product / Functional Decisions

- Attendance V1 still lacks a final source-of-truth model. The code does not establish whether classroom attendance is anchored on faculty-issued QR sessions, timetable sessions, geofence checks, or a combination. There is nothing in backend/api-gateway/prisma/schema.prisma to represent the class session that QR or geofence validation would attach to.
- Late policy is unresolved. The seed in backend/api-gateway/prisma/seed.ts uses LATE, but the route/service layer does not define whether LATE is in or out of scope for V1.
- Faculty scope is unresolved. Docs mention faculty in frontend/web-dashboard/README.md and frontend/mobile-app/README.md, but there is no code contract for whether faculty can only mark/view their own classes or see any reliability data.
- Timetable normalization is unresolved. backend/services/schedule-attendance-service/README.md says the service owns schedules and class sessions, but the actual schema has no course or enrollment model. The product still needs a decision on shared timetable templates versus per-student duplication.
- Presence confidence is unresolved. Current docs describe GPS, BLE, and geofence-derived signals in backend/ingestion/README.md and README.md, but there is no code-level decision on how confidence is stored or surfaced.
- Access credentials are unresolved beyond RFID storage. The product expectation says physical ID card is canonical for V1, but the code only stores an optional RFID tag on profile in backend/api-gateway/prisma/schema.prisma. There is no formal credential model or explicit decision on mobile credential timing.
- Incident visibility and lifecycle are unresolved. The schema in backend/api-gateway/prisma/schema.prisma defaults to OPEN, but there is no enforced set of statuses or clear decision on whether students ever see incidents.
- Notification architecture is unresolved. backend/realtime/README.md points toward websocket-based push, but nothing in code chooses between websocket, SSE, or polling.
- Reliability scoring is unresolved at the product level. backend/services/reliability-service/README.md and backend/ml-services/README.md describe signals conceptually, but there is no finalized formula, threshold model, cadence, or visibility policy.

## 9. Recommended Next Build Order

### Immediate next tasks

1. Normalize cross-stack contracts first. Fix role casing end to end, align activation semantics, align error envelope parsing, and reconcile path naming between backend/api-gateway/src/plugins/auth.ts, backend/api-gateway/src/services/auth-service.ts, frontend/web-dashboard/campus-guardian-dashboard-main/src/services/authApi.ts, frontend/web-dashboard/campus-guardian-dashboard-main/src/services/apiClient.ts, and backend/api-gateway/src/app.ts. This is the cheapest high-impact stabilization step.
2. Harden the existing identity/admin slice. Add resend activation, bulk import, suspend/deactivate, and stop leaking activation/reset tokens by extending backend/api-gateway/src/routes/admin-students.ts, backend/api-gateway/src/plugins/auth.ts, and backend/api-gateway/src/stores/prisma-auth-store.ts.
3. Add the missing scheduling foundation before trying to implement attendance. Create timetable, course, section, class-session, and enrollment models in backend/api-gateway/prisma/schema.prisma, then expose them through the schedule layer described in backend/services/schedule-attendance-service/README.md.
4. Add FACULTY only after class ownership exists. Then implement faculty-scoped attendance creation and viewing, with strict no-live-location access.
5. Implement attendance for real on top of timetable and faculty ownership. Replace backend/api-gateway/src/routes/attendance.ts with real reads/writes, manual QR issuance rules, geofence validation, and final status policy.

### Medium priority

1. Implement real access control next. Build a policy/entitlement model, RFID/card decisioning, denied access logging, and security escalation behind backend/api-gateway/src/routes/access.ts and the access service boundary in backend/services/access-service/README.md.
2. Implement incidents and alerts together. Extend backend/api-gateway/prisma/schema.prisma with stricter incident and alert models, then replace backend/api-gateway/src/routes/incidents.ts with real CRUD and role-based management.
3. Build presence as its own subsystem, not as a side effect of access or attendance. Add presence event/state models, ingest paths beyond backend/ingestion/README.md, and real APIs to replace backend/api-gateway/src/routes/presence.ts.
4. After those APIs exist, replace direct mock imports in the dashboard pages with real calls. The main UI integration targets are frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminDashboard.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminStudents.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminIncidents.tsx, frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminPresence.tsx, and the student pages that currently read from mocks.

### Later / Vfinal items

1. Add notifications and realtime after incidents and presence are real, using backend/realtime/README.md as the planned boundary.
2. Add reliability scoring only after attendance, access, and presence produce trustworthy signals. That work belongs behind backend/services/reliability-service/README.md and backend/ml-services/README.md.
3. Build the actual mobile app after the backend contract for auth, attendance, access, and presence is stable. Right now frontend/mobile-app/README.md is only a product note.

## 10. Concrete Done vs Left Verdict

About 32% is truly done. The part that is genuinely complete is the identity core: Prisma-backed accounts, sessions, one-device binding, password reset, profile fetch, and a basic admin create-student flow. The rest of the repo is mostly a combination of schema groundwork, seeded sample data, route placeholders, and UI scaffolding.

What is left are the major product slices that actually make Nexus "Nexus": timetable and faculty ownership, real attendance validation, real access decisioning, presence ingestion and state, incidents and alerts lifecycle, frontend integration, notifications/realtime, reliability scoring, and the mobile app. The repo is dev-ready for auth and schema-driven backend work, but as a product it is still foundational, not demo-ready beyond auth/admin provisioning and mock-backed dashboard walkthroughs.




## **NEXT STEPS**

1) Clean up and lock identity (1–2 focused sessions)
Goal: make auth/admin “boringly correct” so nobody breaks it later.

Concrete steps:

Fix the small technical debts you already know about:

Ensure switchDevice uses the same 7‑day expiry as createSession so refresh works consistently.

Remove dead/commented auth code (deprecated auth.ts, old mock store blocks).

Stop returning/logging activation/reset tokens in responses except where explicitly dev-only.

Normalize roles end-to-end:

Decide: roles in JWT are STUDENT/ADMIN/SECURITY (uppercase enum) or lowercased.

Make backend routes compare in one way (e.g. always role.toUpperCase()).

Make frontend expect exactly that casing.

Align error envelopes:

Backend sends { error: { code, message } }.

Frontend API client should unwrap and display error.message correctly.

This gives everyone a stable “identity spine” they can safely build on.

2) Define and model timetable & class sessions (big design step)
This is the real blocker for meaningful attendance. Do this before touching attendance routes.

Design and implement in Prisma:

Course (e.g. CS101).

Section (CS101-A, CS101-B).

Group (CS101-A1, CS101-A2 if you need sub-groups).

ClassSessionTemplate (recurring pattern: course, section/group, day-of-week, start/end time, room).

Optionally ClassSessionInstance (actual dated instances, if you want explicit rows per day).

Also:

Map students to groups.

Map faculty to sections/groups they teach.

Once this is in schema.prisma and migrated, you can:

Know which class is happening now for a given student/faculty.

Attach attendance records to session IDs, not just raw classId: string.

You don’t have to perfect it, but get a v0 schema in place.

3) Introduce FACULTY role and basic faculty ownership
After timetable:

Extend UserRole enum with FACULTY and migrate.

Create a simple mapping:

FacultyAccount -> teaches [Section/Group].

Add minimal routes:

Faculty can list their current/next sessions.

Faculty can view attendance for their own sessions only.

You can skip UI for now; this is about backend contract.


Plan: Identity Spine, Timetable v0, Faculty Backend
Recommended sequence: stabilize identity first, then add timetable primitives in Prisma, then layer FACULTY ownership and faculty-only backend endpoints on top. That keeps the risky auth/contract changes isolated before you expand the schema.

1. Lock identity first
Make role casing canonical as uppercase everywhere that crosses service boundaries.
Files:
index.ts:12
prisma-auth-store.ts:28
fastify.d.ts:17
index.ts:1

Snippet direction:
role: "student" | "security" | "admin"
->
role: "STUDENT" | "SECURITY" | "ADMIN"

Why:
Prisma already uses uppercase enum values, so this removes the current DB/backend/frontend mismatch instead of constantly converting.

Stop lowercasing roles inside the Prisma auth store.
File:
prisma-auth-store.ts:37

Snippet direction:
role: createdAccount.role.toLowerCase()
->
role: createdAccount.role

And:
role: account.role.toLowerCase()
->
role: account.role

Also keep status lowercased only if you want that as an API convention. If not, normalize it consistently too.

Make session expiry a shared constant and use it in both session creation paths.
File:
prisma-auth-store.ts:92

Snippet direction:
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
->
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

Apply it in both:
prisma-auth-store.ts:92
prisma-auth-store.ts:181

Why:
Today both already use 7 days, but duplicating the literal is how this drifts later.

Keep JWT payloads and auth responses on the same canonical role shape.
File:
auth-service.ts:51

Snippet direction:
const payload = { sub: account.studentId, deviceId, role: account.role }

Keep that shape for:
login
deviceSwitch
refresh

Also remove the debug log:
console.log("DATABASE HANDED ME THIS ROLE:", account.role)

Normalize all backend role checks to one convention.
Files:
attendance.ts:11
admin-students.ts
students.ts

Minimum safe change:
user.role !== "admin"
->
user.role.toUpperCase() !== "ADMIN"

Better long-term pattern:
add one helper like isRole(user.role, "ADMIN") or hasAnyRole(user.role, ["ADMIN", "SECURITY"]) and reuse it across route files.

Stop exposing reset tokens unless explicitly dev-only.
File:
auth.ts:95

Snippet direction:
console.log(Token: ${resetToken})
return { message: "...", resetToken }
->
return { message: "If an account exists for this identifier, a reset token has been generated." }

Optional dev-only version:
if process.env.EXPOSE_DEV_TOKENS === "true", include a devOnly.resetToken field.
Otherwise do not log or return it.

Fix frontend role expectations to match uppercase roles.
Files:
index.ts:1
App.tsx:37
ProtectedRoute.tsx:17
AppSidebar.tsx:46
AppHeader.tsx:57

Snippet direction:
allowedRoles={["student"]}
->
allowedRoles={["STUDENT"]}

user.role === "admin"
->
user.role === "ADMIN"

Fix frontend error envelope unwrapping.
File:
apiClient.ts:37

Snippet direction:
errorBody = await response.json()
throw new ApiHttpError(errorBody, response.status)
->
const envelope = await response.json()
const errorBody = envelope.error ?? envelope
throw new ApiHttpError(errorBody, response.status)

Why:
Your backend already sends:
{ error: { code, message } }
but the frontend currently expects:
{ code, message }

Keep auth response normalization, but do not silently lowercase roles anymore.
File:
authApi.ts:10

Plan:
preserve uppercase role values in normalizeAuthResponse
update mock users too if you still rely on mock mode, otherwise your manual UI tests will lie to you

2. Add timetable v0 in Prisma before real attendance work
Extend the Prisma schema with timetable primitives.
File:
schema.prisma
Add these models:
Course
Section
StudentGroup
StudentGroupMembership
FacultyProfile
FacultyAssignment
ClassSessionTemplate

Recommended v0 fields:
Course: id, code, title, department, credits
Section: id, courseId, code, term, year
StudentGroup: id, sectionId, code, name
StudentGroupMembership: id, groupId, studentAccountId
FacultyProfile: id, accountId, firstName, lastName, department, title
FacultyAssignment: id, facultyAccountId, sectionId nullable, groupId nullable
ClassSessionTemplate: id, sectionId, groupId nullable, facultyAccountId nullable, dayOfWeek, startTime, endTime, room, geofenceId nullable

Add FACULTY to the Prisma role enum in the same migration batch.
File:
schema.prisma:9
Snippet direction:
enum UserRole {
STUDENT
ADMIN
SECURITY
}
->
enum UserRole {
STUDENT
ADMIN
SECURITY
FACULTY
}

Why:
Do this together with faculty data structures so role expansion is not dangling.

Replace raw classId on attendance with timetable-backed keys.
File:
schema.prisma:56
Because you chose templates only for v0, the cleanest temporary shape is:
classSessionTemplateId
scheduledDate
relation to ClassSessionTemplate

Snippet direction:
classId String
->
classSessionTemplateId String
scheduledDate DateTime

This is the compromise that lets attendance stop pointing to arbitrary strings now, while deferring full dated ClassSessionInstance rows.

Generate one Prisma migration for the timetable/faculty batch.
Outputs:
new migration under migrations
Keep this migration focused:
role enum expansion
new timetable/faculty tables
attendance foreign-key reshaping

Update seed data so the new model is actually usable.
File:
seed.ts
Add:
one FACULTY account
one course
one section
one or two groups
student-group memberships
faculty assignment
class session templates
attendance rows tied to classSessionTemplateId plus scheduledDate

That gives you something real to test against immediately.

3. Add faculty ownership and backend contract
Extend shared types with FACULTY after the Prisma migration lands.
File:
index.ts:14
Snippet direction:
export type UserRole = "STUDENT" | "SECURITY" | "ADMIN"
->
export type UserRole = "STUDENT" | "SECURITY" | "ADMIN" | "FACULTY"

Make sure the auth store and auth response path accept FACULTY without special handling.
Files:
prisma-auth-store.ts
auth-service.ts
fastify.d.ts
Goal:
login, refresh, and device switch should work for FACULTY exactly the same way they work for ADMIN or STUDENT.

Add a new faculty route module under the existing routes directory.
Recommended endpoints:
GET /faculty/me/sessions/current-next
GET /faculty/me/sessions/:sessionTemplateId/attendance
Route behavior:
current-next endpoint computes current and upcoming sessions from ClassSessionTemplate based on weekday and current time
attendance endpoint first verifies the authenticated FACULTY owns the section/group through FacultyAssignment, then returns attendance only for owned sessions

Register the faculty routes in the app.
File:
app.ts:3
Keep:
same authenticate middleware
same error envelope
same Fastify plugin pattern as the existing route files

If the auth Zod schema is role-restricted anywhere, widen it.
File:
auth.ts
Check:
response user.role typing
any enum literals
any frontend-facing shape assumptions

4. Leave attendance route logic until timetable is in place
Do not rewrite the real attendance business logic until the timetable migration and seed are done.
File to revisit later:
attendance.ts
Immediate change now:
fix broken role checks

Later change:
query attendance using classSessionTemplateId plus scheduledDate instead of classId strings

Relevant files
schema.prisma
seed.ts
prisma-auth-store.ts
auth-service.ts
auth.ts
attendance.ts
app.ts
auth.ts
fastify.d.ts
index.ts
index.ts
apiClient.ts
authApi.ts
App.tsx
ProtectedRoute.tsx
AppSidebar.tsx
AppHeader.tsx

Testing after implementation
Identity regression on backend:
exercise login, refresh, device switch, forgot-password, and reset-password from test.http or scratch.http
verify refresh and switch both preserve the 7-day session expiry behavior
verify forgot-password no longer logs or returns resetToken unless the explicit dev flag is enabled

Error envelope regression on frontend:
trigger invalid login
trigger invalid activation token
trigger expired reset token
confirm the dashboard shows backend error.message correctly

Role regression end-to-end:
log in as STUDENT, ADMIN, SECURITY, and FACULTY
confirm JWT payload role is uppercase
confirm protected backend routes allow and deny correctly
confirm frontend route guards and admin/sidebar logic still work with uppercase roles

Prisma validation:
run prisma format
run prisma validate
run prisma migrate dev
run prisma generate
run the seed script
confirm the new course, section, group, faculty assignment, and class session template data exists

Faculty contract validation:
call GET /faculty/me/sessions/current-next with a seeded faculty account
confirm only assigned sessions are returned
call GET /faculty/me/sessions/:sessionTemplateId/attendance for both owned and unowned sessions
confirm owned returns data and unowned returns 403

Timetable integrity checks:
verify you can answer all of these from the DB:
which group a student belongs to
which faculty teaches a given section or group
which recurring session applies right now for a faculty member or student on a given weekday/time

Two decisions are now locked into this plan: uppercase role casing, and templates-only for timetable v0. The one tradeoff to keep in mind is that without ClassSessionInstance, attendance should use classSessionTemplateId plus scheduledDate for now, then move to true instance IDs later if you need explicit per-day session rows.

If you want, I can refine this one more step into a commit-by-commit plan so you can execute it in the cleanest order.

## MORE INFO

Start with identity cleanup, then move to Prisma, then faculty routes. You already have a good plan; here’s the **execution order** I’d follow from what you pasted.

***

## Step 1 — Identity spine (backend + frontend)

Do this first, in small commits.

1. **Canonicalize roles to uppercase across backend:**
   - In `prisma-auth-store.ts`, stop lowercasing roles:
     - `createdAccount.role.toLowerCase()` → `createdAccount.role`
     - `account.role.toLowerCase()` → `account.role`
   - In route files (`attendance.ts`, `admin-students.ts`, `students.ts`, etc.), change checks to:
     - `user.role.toUpperCase() === "ADMIN"` style.
   - Keep JWT payload as `{ sub, deviceId, role: account.role }` in `auth-service.ts` and remove the debug log.

2. **Centralize session TTL:**
   - In `prisma-auth-store.ts`, define:
     - `const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;`
   - Use it in both `createSession` and `switchDevice` when computing `expiresAt`.

3. **Stop exposing reset tokens:**
   - In `auth` plugin, remove dev logging and `resetToken` from the response.
   - Optional: gate it behind `EXPOSE_DEV_TOKENS` if you really want a dev-only mode.

4. **Align frontend role expectations:**
   - In `Auth` types, `ProtectedRoute`, `App.tsx`, sidebar/header, etc., change:
     - `"student" | "admin" | "security"` → `"STUDENT" | "ADMIN" | "SECURITY"`.
   - Update `allowedRoles` arrays accordingly.

5. **Fix frontend error envelope:**
   - In `apiClient.ts`, unwrap `{ error: { code, message } }`:
     - `const envelope = await response.json();`
     - `const errorBody = envelope.error ?? envelope;`
     - throw with `errorBody`.

6. **Quick regression test:**
   - Run through login, refresh, device switch, forgot/reset using your HTTP file.
   - Trigger invalid login/activation/reset and confirm errors show correctly in the UI.

***

## Step 2 — Timetable v0 in Prisma

Once identity is stable, do the timetable migration.

1. **Extend `schema.prisma`:**
   - Add:
     - `Course`
     - `Section`
     - `StudentGroup`
     - `StudentGroupMembership`
     - `FacultyProfile`
     - `FacultyAssignment`
     - `ClassSessionTemplate`
   - Add `FACULTY` to `UserRole`.

2. **Change attendance to use timetable keys:**
   - Replace `classId: String` in `AttendanceRecord` with:
     - `classSessionTemplateId: String`
     - `scheduledDate: DateTime`
     - plus relation to `ClassSessionTemplate`.

3. **Run Prisma commands:**
   - `npx prisma format`
   - `npx prisma migrate dev --name add_timetable_and_faculty`
   - `npx prisma generate`

4. **Update `seed.ts`:**
   - Seed:
     - 1–2 `Course`s
     - 1–2 `Section`s
     - 1–2 `StudentGroup`s
     - memberships for your existing students
     - a `FacultyProfile` + `FacultyAssignment`
     - 2–3 `ClassSessionTemplate`s
     - `AttendanceRecord` rows using `classSessionTemplateId + scheduledDate`.

5. **Validate:**
   - Run seed.
   - Inspect DB to confirm you can answer:
     - which group a student belongs to,
     - which faculty teaches a section/group,
     - which sessions exist for a given weekday/time.

***

## Step 3 — Faculty backend contract

After timetable schema + seed:

1. **Extend shared role types:**
   - In your shared `index.ts` / core types, add `"FACULTY"` to `UserRole`.

2. **Ensure auth supports FACULTY:**
   - `prisma-auth-store.ts`, `auth-service.ts`, and `fastify.d.ts` should treat FACULTY exactly like other roles (no special-casing needed yet).

3. **Add faculty routes:**
   - Create `routes/faculty.ts` with endpoints like:
     - `GET /faculty/me/sessions/current-next`
     - `GET /faculty/me/sessions/:sessionTemplateId/attendance`
   - Behavior:
     - `current-next`: compute sessions from `ClassSessionTemplate` and time.
     - `attendance`: verify the authenticated FACULTY is assigned to that section/group via `FacultyAssignment`; return attendance only if owned, else 403.

4. **Register in `app.ts`:**
   - `await app.register(facultyRoutes);`
   - Reuse `authenticate` hook and existing error handler.

5. **Sanity test:**
   - Login as seeded faculty, call the new endpoints.
   - Verify ownership checks work: owned → data, unowned → 403.

***

## Where to literally start right now

If you sit down for your next session, I’d do:

1. Identity cleanup commit:
   - Role casing changes.
   - Session TTL constant.
   - Reset token exposure removed.
   - Frontend role + error handling fixes.
   - Build + quick regression tests.

2. New branch / commit for **timetable v0**:
   - Prisma schema changes + migrate + seed.

3. New commit for **faculty routes**:
   - FACULTY enum + type wiring + faculty endpoints + tests.

After that, you’re in a great position to tackle **real attendance logic** on top of a proper timetable + faculty ownership.