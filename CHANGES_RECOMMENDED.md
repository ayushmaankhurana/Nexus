# CHANGES RECOMMENDED — Council Review (2026-05-07)

Internal technical review of NEXUS. This is not a PR description — it is an honest assessment of what works, what is misleading, what is broken, and what must change before this can be shown to real users or deployed.

---

## Product Perspective

### What works
- Student login → personal dashboard with live attendance and access data
- Faculty login → scoped attendance view (only their assigned sections)
- Admin login → full operations dashboard with real stats from backend
- Activation flow → correctly redirects to login after activation (no auto-login confusion)
- QR attendance marking (with geofence validation) — backend complete
- Access control check/record (RFID, manual) — backend complete
- Presence intel (admin sees all, faculty sees own students) — backend complete

### What is missing
- **No email delivery** — activation tokens and password reset tokens are logged to the server console. This means zero ability to onboard a real student without direct server access.
- **No timetable management UI** — an admin cannot create courses, sections, or class schedules through the app. Seed data must be used.
- **No incident management backend** — the Incidents page shows fictional data and creates a false impression of capability.
- **No alert backend** — alerts are derived client-side from attendance/access data, but there is no push notification, no server-side alert store, and no dismissal persistence.

### What is misleading to users
- "Incidents" and "Alerts" pages in admin panel now have "Planned" banners, but the data still looks real. A demo audience will likely believe it is live.
- "Active Students" stat card previously used mock data — now fixed to real backend count.
- Dashboard stats (`presentToday`) will show 0 because seeded attendance is for past dates. This may look like a bug to a reviewer.

### Must fix before first real demo/deployment
- Add email transport for activation and reset tokens
- Build at least a stub alert model (even if just a table with no real triggers)
- Make `presentToday` reflect a useful date range (e.g. current week) or rename the stat

### Fix soon
- Timetable CRUD admin UI (at minimum: create a section and assign a faculty)
- Incident model: make `status` field an enum in the schema

### Later improvements
- Push notifications for attendance threshold alerts
- Export attendance to CSV

---

## Engineering Perspective

### Code quality issues
- `attendance-service.ts`: the `mapRecord` method uses `record: any` which bypasses type safety for a core domain object
- `prisma-auth-store.ts`: `suspendAccount` calls `this.invalidateAllSessions` internally but the route also calls it redundantly — consolidate
- `app.ts`: CORS allowed origins hardcoded; should be in env var
- `presence/controller.ts`: imports `getPrismaClient()` directly inside a controller function — breaks the separation where only stores should touch Prisma
- `dataApi.ts`: many API functions are large flat functions; would benefit from splitting into separate files per domain
- `authApi.ts`: imports `mockStudentUser`, `mockAdminUser`, `mockSession` even though `USE_MOCK = false` — dead import

### Dead code / patterns
- `deprecated auth.ts` — deleted in this session
- Commented-out block in `plugins/auth.ts` — deleted in this session
- `mock-auth-store.ts` still exists but is not imported anywhere; can be deleted
- Commented-out refresh schema route in `plugins/auth.ts` — deleted in this session

### Missing abstractions
- No service layer for access control — `routes/access.ts` directly imports Prisma client
- No dedicated error types per domain — all errors use generic `AppError`
- No request/response DTOs that are separate from Prisma types

### Must fix before first real demo/deployment
- Remove `mock-auth-store.ts` (dead code)
- Remove dead mock imports from `authApi.ts`
- Move CORS origins to env var

### Fix soon
- Add type to `mapRecord` in attendance service
- Split `dataApi.ts` by domain
- Move Prisma access out of presence controller into presence store

### Later improvements
- Add service layer for access control
- Domain-specific error types
- OpenAPI/Swagger spec generation from Fastify schemas

---

## Security Perspective

### What got fixed in this session
- `/auth/logout` now requires JWT — previously unauthenticated
- `/auth/device/switch` now requires JWT — previously unauthenticated
- `resetToken` removed from forgot-password API response body
- `activationToken` removed from admin create-student response body
- Password reset now invalidates ALL sessions (not just one)
- `SUSPENDED` account status added; admin suspend/reactivate routes added
- `/dev/demo/reset` now requires `x-demo-secret` header
- Frontend verifies stored JWT against backend on boot
- Frontend 401 → refresh → retry logic implemented

### Remaining vulnerabilities

**Critical:**
- No email transport means reset/activation tokens are only accessible to someone with server terminal access. In any environment with real users, this is a security hole (users cannot reset their own passwords).
- JWT secret falls back to `'dev-backup-secret-123'` if `JWT_SECRET` env var is not set. A misconfigured deployment would accept tokens signed with this known string.

**High:**
- `resetToken` is stored in plaintext in the database. If the DB is compromised, all pending reset tokens are exposed.
- Refresh tokens are not rotated — a stolen refresh token remains valid until it expires (7 days).
- No rate limiting on `/auth/login` or `/auth/password/forgot` — brute-force possible.

**Medium:**
- Session cap not enforced. A user can create unlimited sessions across unlimited devices.
- No CSRF protection (not critical for token-based auth, but relevant if cookies are ever used).
- `Incident.status` is a plain string — no DB constraint. An attacker who can POST to incidents could set arbitrary status strings.

**Low:**
- RFID tag comparison is plain string equality — no cryptographic binding between physical tag and account.
- No audit log for admin actions (suspend, reactivate, manual attendance marks).

### Must fix before first real demo/deployment
- Add email transport
- Add rate limiting to auth endpoints (`@fastify/rate-limit`)
- Enforce JWT_SECRET as required (no fallback in any environment)
- Hash `resetToken` before storing in DB

### Fix soon
- Implement refresh token rotation
- Enforce session cap

### Later improvements
- Add audit log for privileged actions
- RFID cryptographic binding
- CSRF protection if switching to cookie auth

---

## UX Perspective

### Where the UI is misleading
- Incidents page: shows fictional incidents with names, locations, severity, and status. Without the "Planned" banner (now added), this looks like real data. Even with the banner, a demo audience will be confused.
- Alerts page: similar issue — mock alerts look real.
- Activity Log: mock events with realistic-looking timestamps and descriptions.
- Admin dashboard "Active Students" stat now comes from real backend. Previously it was a hardcoded mock count.
- Student dashboard "Unread Alerts" is derived from real attendance/access data and may show 0 even when the student has absences, depending on the alert logic threshold.

### Broken flows
- **Password reset**: no UI for the reset flow — a user would need to call the API directly. The forgot-password and reset-password pages are not implemented in the frontend.
- **Device switch**: exposed in the API and `test.http` but not reachable from any frontend UI.
- **Student account page**: shows the user's profile but has no working "change password" or "manage devices" feature.
- **Support page**: form submits to mock; no backend.

### Navigation gaps
- Faculty role: correctly shows faculty sidebar, but if a faculty member navigates to `/admin/students` directly they get 403 — which is correct but the URL is guessable from the admin sidebar they've previously seen.
- No "access denied" page with context — the generic UnauthorizedPage doesn't explain why access was denied.

### Must fix before first real demo/deployment
- Implement forgot-password and reset-password pages in the frontend
- Remove or stub the student "change password" UI if it doesn't work

### Fix soon
- Add toast notification when activation succeeds (currently the redirect to `/login` has no visible feedback unless you add state-based message display in LoginPage)
- Add context to the UnauthorizedPage (e.g. "Your account is pending activation")

### Later improvements
- Device management UI (list active sessions, revoke individual sessions)
- Proper empty states with actionable CTAs

---

## QA / Testing Perspective

### What exists
- `test.http` at repo root — covers login, refresh, logout, device switch, activation, password reset, attendance (student own, admin list, faculty manual mark, session summary), access check, access history, presence update
- Basic TypeScript type checking (`tsc --noEmit`)
- No unit tests, no integration tests, no end-to-end tests

### What `test.http` covers
- Happy path for all major auth flows
- Faculty attendance session summary before/after manual mark
- RFID-based access check (allowed, denied, mismatch)
- Negative auth tests (wrong password, reused reset token)
- New tests for: faculty login, faculty-scoped attendance, admin suspend/reactivate, dashboard stats, demo reset with secret header

### What `test.http` misses
- Faculty presence overview (not yet in test.http)
- SUSPENDED account status: login attempt with suspended account
- Session cap enforcement (can't test without implementation)
- Concurrent request tests (race conditions)
- Any frontend behavior (no browser automation)

### What is entirely untested
- All frontend components (no React Testing Library tests)
- Error boundary behavior
- Token refresh flow (the actual 401 → refresh → retry cycle)
- Pagination edge cases (page > totalPages, pageSize = 0)
- Invalid UUID inputs to parameterized routes
- SQL injection (Prisma parameterized queries should protect, but untested)

### Must fix before first real demo/deployment
- Add at minimum a smoke test that boots the server and hits the health endpoint
- Add a test for the 403 demo reset path (missing secret)

### Fix soon
- Add Vitest unit tests for attendance service (mark, list, scoping)
- Add React Testing Library tests for login flow

### Later improvements
- Full E2E suite with Playwright
- Load testing with k6

---

## Architecture / Scalability Perspective

### Current coupling issues
- Single Prisma client (singleton) shared across all domains — no isolation
- Auth plugin instantiates `PrismaAuthStore` directly — no dependency injection
- Presence controller imports `getPrismaClient()` directly (bypasses store layer)
- All routes registered in a single Fastify instance — no plugin scoping by domain

### What needs to change before production
- At minimum: environment variable validation at startup (fail fast if `JWT_SECRET` missing)
- Connection pooling configuration for Prisma (currently uses default settings)
- Proper logging (currently Fastify default logger — no structured log shipping)
- Health check endpoint needs DB ping (currently just returns 200 without checking DB connectivity)

### What deferred decisions will cost later
- **No event bus / message queue**: when incidents or alerts are implemented, they will need to notify multiple consumers (email, push, frontend). Adding this later requires retrofitting all existing flows.
- **Flat schema for timetable**: `ClassSessionTemplate` uses raw `dayOfWeek` int + time strings. Adding cancelled-class or makeup-class logic will require a schema migration.
- **Flat `Incident.status` string**: changing this to an enum later requires a migration and code changes across the incident domain.
- **Device ID is a client-generated random string**: no server-side device registration. Migrating to server-assigned device tokens later will invalidate all existing sessions.
- **No multi-campus support**: all geofences, sections, and accounts are in one flat namespace. Adding departments or campuses later will require significant schema changes.

### Must fix before first real demo/deployment
- Add startup validation for required env vars
- Add DB connectivity check to health endpoint
- Add connection pool configuration to Prisma

### Fix soon
- Scope Fastify plugins by domain prefix (`/auth/*`, `/attendance/*`, etc.) for better encapsulation
- Replace `any` types in store methods with proper Prisma-generated types

### Later improvements
- Extract auth into its own service
- Add an event bus (e.g. BullMQ) for cross-domain notifications
- Add OpenTelemetry tracing
