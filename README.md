# NEXUS – Unified Campus Intelligence Platform

**NEXUS** is a full-stack platform for unified campus attendance tracking, access verification, and security monitoring. The system integrates student presence signals (GPS, BLE, schedule validation) with access control and behavioral reliability scoring to provide campus administrators and security teams with real-time visibility into student activity and anomalies.

## Table of Contents

- [Project Overview](#project-overview)
- [Current Implementation Status](#current-implementation-status)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Backend Documentation](#backend-documentation)
- [Frontend Documentation](#frontend-documentation)
- [API Routes & Endpoints](#api-routes--endpoints)
- [Schemas & Contracts](#schemas--contracts)
- [Authentication & Authorization](#authentication--authorization)
- [Local Development](#local-development)
- [Testing & Verification](#testing--verification)
- [Known Issues & Gaps](#known-issues--gaps)
- [Roadmap & Next Steps](#roadmap--next-steps)

---

## Project Overview

### What Problem Does NEXUS Solve?

Traditional campus management systems treat attendance, access control, and security as separate silos. NEXUS unifies these domains into a single intelligent platform:

- **Attendance**: Students mark attendance through mobile app with location/BLE validation; no manual roll calls
- **Access Verification**: Single unified credential (student ID + phone device) gates campus entry and parking
- **Security Monitoring**: Real-time presence tracking, loitering detection, anomaly alerts for administrators
- **Offline Resilience**: DOLN (Delay-Optimized Local Network) enables offline presence logging with later sync

### Key Design Principles

1. **Admin-provisioned only**: No public self-signup; accounts created by campus administrators
2. **One active device per student**: Prevents credential sharing; simplifies location tracking
3. **Device binding with switching**: Students can switch devices but not use multiple simultaneously
4. **Structured error codes**: All failures return semantic codes (e.g., `DEVICE_ALREADY_BOUND`) for client clarity
5. **Modular architecture**: Clear service boundaries enable independent scaling and future extension

### What's Implemented vs. Planned

| Component | Status | Notes |
|-----------|--------|-------|
| **Student Account Management** | ✅ Complete | Activation tokens, password setting, account status tracking |
| **Authentication** | ✅ Complete | Login (email or roll#), device binding, logout |
| **Device Switching** | ✅ Complete | Atomic session transfer between devices |
| **API Gateway (HTTP)** | ✅ Complete | Fastify-based REST API on port 3000 |
| **CORS for Local Dev** | ✅ Complete | Allows localhost:8080 and localhost:5173 |
| **Frontend Web Dashboard** | ✅ Integrated | React/Vite, real auth integration, mock data for dashboards |
| **Student Dashboard** | ✅ UI Complete | Wired to real auth, uses mock attendance/access data |
| **Admin Dashboard** | ✅ UI Complete | Wired to real auth, uses mock student/incident data |
| **Attendance Routes** | ⏳ Stubbed | Returns placeholder; no business logic |
| **Access Verification Routes** | ⏳ Stubbed | Returns placeholder; no business logic |
| **Incidents Routes** | ⏳ Stubbed | Returns placeholder; no business logic |
| **Presence Routes** | ⏳ Stubbed | Returns placeholder; no business logic |
| **Database Persistence** | ⏳ Not Started | Currently in-memory stores only |
| **JWT Token Generation** | ⏳ Not Started | Uses UUID tokens; no cryptographic signing |
| **Mobile App** | ⏳ Not Started | Folder created; no implementation |
| **WebSocket/Real-time** | ⏳ Not Started | Not yet integrated |
| **ML Scoring** | ⏳ Not Started | Reliability/risk scores are placeholder concept |

---

## Current Implementation Status

### What's Working (Production-Ready for Auth Only)

#### Backend
- ✅ **POST /auth/activate** — Full account activation with token validation
- ✅ **POST /auth/login** — Login by roll number or email, device binding, one-device policy enforced
- ✅ **POST /auth/logout** — Session invalidation
- ✅ **POST /auth/device/switch** — Atomic device session transfer
- ✅ **GET /health** — Health check endpoint
- ✅ **Error handling** — All appErrors return structured `{ code, message }` responses
- ✅ **CORS** — localhost:8080 and localhost:5173 allowed for frontend dev

#### Frontend
- ✅ **Login Flow** — Real backend integration; credentials (email or roll#); device binding
- ✅ **Account Activation** — UI for accept activation token and set password
- ✅ **Auth Context** — Persistent auth state with localStorage (token, user, deviceId)
- ✅ **Protected Routes** — Route guards prevent unauthenticated access
- ✅ **User-Shape Normalization** — Frontend safely handles missing `name` from backend (falls back to studentId, email, or "User")
- ✅ **Defensive Rendering** — Helper functions `getDisplayName()` and `getUserInitials()` prevent crashes on null/undefined

#### Frontend Dashboard Pages
- ✅ **Student Views** — Dashboard, Attendance, Access, Alerts, Account, Support
- ✅ **Admin Views** — Dashboard, Students, Attendance, Access, Incidents, Presence, Alerts, Activity
- ✅ **Settings Page** — Theme toggle, security info
- ✅ **Mock Data** — All dashboard data currently from local mocks, not backend

### What's Partially Complete

#### Backend Routes (Protected & Integrated)
- ✅ **GET /students/me** — Protected by JWT; returns authenticated user profile
- ✅ **GET /students/:studentId/attendance** — Protected by JWT; validates student ownership
- ✅ **POST /students/:studentId/attendance** — Protected by JWT; validates student ownership
- ✅ **GET /access/:studentId** — Protected by JWT; validates student ownership
- ✅ **POST /access/check** — Protected by JWT; validates student ownership
- ✅ **GET /presence/:studentId** — Protected by JWT; validates student ownership
- ✅ **GET /presence/:studentId/trail** — Protected by JWT; validates student ownership
- ✅ **GET /incidents** — Protected by JWT; returns incidents for authenticated user
- ✅ **POST /incidents** — Protected by JWT; creates incident for authenticated user

### What's Missing / Blocked

1. **Attendance Domain Logic**
   - Marking attendance requires schedule validation, location checks, grace windows
   - Backend has no notion of student timetables or campuses
   - Frontend uses mock data; no integration
   - **Blocker**: Requires schedule + campus zone services

2. **Access Verification**
   - Access checking (gates, parking) not implemented
   - No access control rules or policies
   - **Blocker**: Requires campus topology + access policy services

3. **Presence & Location**
   - No GPS/BLE ingestion pipeline
   - No trail reconstruction
   - **Blocker**: Requires location ingestion + offline sync (DOLN)

4. **Incidents & Alerts**
   - UI placeholders exist; no backend logic
   - No alert generation or escalation workflows
   - **Blocker**: Requires incident service + rules engine

5. **Backend Persistence**
   - All data is in-memory (`MockAuthStore`)
   - Server restart clears all sessions and accounts
   - **Blocker**: Need MongoDB/PostgreSQL integration

6. **Role-Based Access Control**
   - Backend only recognizes `student` role (hardcoded in auth responses)
   - `admin` and `security` roles exist on frontend but not validated on backend
   - **Blocker**: Backend needs to return correct role from account; middleware to enforce

### Latest Feature Additions (Recent)

#### CORS Configuration (Fixed)
- Backend now registers `@fastify/cors` plugin
- Allows `http://localhost:8080` (frontend Vite port)
- Allows `http://localhost:5173` (default Vite dev port as fallback)
- Allows `GET`, `POST`, `OPTIONS` methods
- Allows `Content-Type` and `Authorization` headers
- **Status**: Deployed and tested; no known issues

#### User-Shape Normalization (Fixed)
- Backend login returns: `{ id, rollNumber, email, role }` with no `name` field
- Frontend `normalizeAuthResponse()` function constructs `name` as:
  - First try backend `name` if present
  - Then fallback to `rollNumber` (student ID)
  - Then fallback to `email`
  - Finally fallback to `"User"`
- Frontend `getDisplayName()` and `getUserInitials()` helpers use same fallback logic
- All user-facing display safe from crashes if `name` is undefined
- **Status**: Deployed; AppHeader, AppSidebar, StudentAccount, SettingsPage, AdminDashboard, StudentDashboard all using safe helpers

#### JWT Implementation & Route Protection (Implemented)
- Backend now issues cryptographically signed JWT tokens instead of random UUIDs
- Tokens include `userId`, `roll`, `email`, `role`, `deviceId`, `iat`, and `exp` claims
- Token expiration enforced on validation; expired tokens rejected with 401
- All data routes protected by `@fastify/jwt` plugin with `onRequest: [authenticate]` decorator
- Invalid/missing tokens return 401 with `{ code: 'UNAUTHORIZED', message: '...' }`
- All protected routes validate student ownership (e.g., `GET /students/:studentId/attendance` requires `userId == studentId` or admin role)
- JWT signature verified using RS256 algorithm with auto-generated RSA key pair on startup
- **Status**: Fully implemented; all routes protected; token validation working

### Integration Summary

The frontend successfully:
1. Logs into real backend at `http://localhost:3000`
2. Receives auth tokens and user data
3. Manages device ID persistence
4. Stores user state and tokens in localStorage
5. Displays dashboards with role-based routing (student vs. admin)
6. Safely handles missing user fields

The backend successfully:
1. Validates credentials against in-memory store
2. Enforces one-device binding (DEVICE_ALREADY_BOUND error when violated)
3. Returns properly structured auth responses
4. Issues cryptographically signed JWT tokens with expiration
5. Validates JWT tokens on protected routes (all data endpoints)
6. Enforces student ownership checks on protected routes
7. Handles errors with semantic codes and HTTP status codes
8. Responds to CORS preflight requests

**Known Gap**: Frontend dashboard pages use mock data, not backend data. Auth integration and route protection are fully implemented; data service integration pending.

---

## Repository Structure

### Root Level

```
nexus/
├── package.json              # Workspace root, defines workspaces
├── tsconfig.base.json        # Base TypeScript config shared by all packages
├── tsconfig.json             # Root-level TypeScript config
├── .env                       # Environment variables (gitignored)
├── .gitignore                # Git ignore rules
├── test.http                 # REST Client requests for manual API testing
├── BootstrapPrompt.md        # Bootstrap/setup notes
└── README.md                 # This file
```

### Backend: `/backend`

```
backend/
├── core/                      # @nexus/core package (shared utilities)
│   ├── src/
│   │   ├── index.ts          # Main export point
│   │   ├── config.ts         # Config loaders (env, port, etc.)
│   │   ├── logger.ts         # Pino logger setup
│   │   ├── config/
│   │   │   └── index.ts      # Config helper functions
│   │   ├── logger/
│   │   │   └── index.ts      # Logger instance exports
│   │   └── types/
│   │       └── index.ts      # Shared domain types (User, StudentAccount, Session, AppError)
│   ├── package.json
│   ├── tsconfig.json
│   └── dist/                 # Compiled output
│
├── api-gateway/              # @nexus/api-gateway package (HTTP service)
│   ├── src/
│   │   ├── server.ts         # Entry point; starts fastify, listens on :3000
│   │   ├── app.ts            # Fastify app factory; registers plugins and routes
│   │   ├── plugins/
│   │   │   └── auth.ts       # Auth plugin: service + routes + error handling
│   │   ├── routes/
│   │   │   ├── auth.ts       # POST /auth/* endpoints (login, activate, logout, switch)
│   │   │   ├── health.ts     # GET /health (always returns { status: 'ok' })
│   │   │   ├── students.ts   # GET /students/me (placeholder)
│   │   │   ├── attendance.ts # GET/POST /students/:id/attendance (placeholders)
│   │   │   ├── access.ts     # GET/POST /access/* (placeholders)
│   │   │   ├── incidents.ts  # GET/POST /incidents (placeholders)
│   │   │   └── presence.ts   # GET /presence/* (placeholders)
│   │   ├── services/
│   │   │   └── auth-service.ts # AuthService class; core business logic
│   │   ├── stores/
│   │   │   └── mock-auth-store.ts # MockAuthStore; in-memory data + methods
│   │   ├── schemas/
│   │   │   └── auth.ts       # Zod schemas (ActivateRequestSchema, LoginRequestSchema, etc.)
│   │   ├── types/
│   │   │   └── fastify.d.ts  # TypeScript augmentation for fastify.authService
│   │   └── ...
│   ├── package.json
│   ├── tsconfig.json
│   └── dist/                 # Compiled output
│
├── services/                 # (Future) Domain-specific microservices
│   ├── attendance-service/
│   ├── access-service/
│   ├── presence-service/
│   ├── incident-service/
│   └── ...
├── ingestion/                # (Future) Event intake pipeline (GPS, BLE, DOLN uploads)
├── realtime/                 # (Future) WebSocket and real-time push service
├── ml-services/              # (Future) Anomaly detection, reliability scoring
├── docker/                   # Docker configuration (stubbed)
└── scripts/                  # Utility scripts (stubbed)
```

### Frontend: `/frontend/web-dashboard/campus-guardian-dashboard-main`

This is the actual active frontend. (Mobile app and shared folders are placeholders.)

```
frontend/web-dashboard/campus-guardian-dashboard-main/
├── src/
│   ├── App.tsx               # Main route definitions
│   ├── App.css               # App-level styles
│   ├── main.tsx              # React entry point
│   ├── index.css             # Global styles
│   ├── vite-env.d.ts         # Vite environment variable types
│   │
│   ├── types/
│   │   └── index.ts          # Shared TypeScript types (User, Session, AuthResponse, etc.)
│   │
│   ├── config/
│   │   └── env.ts            # Environment config; API_BASE_URL setup
│   │
│   ├── services/
│   │   ├── authApi.ts        # Auth API service (login, activate, logout, deviceSwitch)
│   │   ├── apiClient.ts      # Low-level HTTP client (apiPost, apiGet, token management)
│   │   └── dataApi.ts        # Future data API service
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state management with useAuth hook
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx    # Mobile viewport detection
│   │   └── use-toast.ts      # Toast notifications
│   │
│   ├── lib/
│   │   └── utils.ts          # Helper functions (cn, getDisplayName, getUserInitials)
│   │
│   ├── mocks/
│   │   └── data.ts           # Mock data (students, attendance, access events, etc.)
│   │
│   ├── components/
│   │   ├── NavLink.tsx       # Navigation link component
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx # Top header with user info
│   │   │   ├── AppLayout.tsx # Main layout wrapper
│   │   │   ├── AppSidebar.tsx # Left sidebar with nav
│   │   │   └── ProtectedRoute.tsx # Route guard for authenticated pages
│   │   ├── shared/          # Reusable components (PageHeader, StatusBadge, etc.)
│   │   └── ui/              # shadcn/ui component wrappers (button, dialog, etc.)
│   │
│   ├── pages/
│   │   ├── Index.tsx         # Landing/home page
│   │   ├── NotFound.tsx      # 404 page
│   │   ├── SettingsPage.tsx  # User settings (theme, profile)
│   │   ├── UnauthorizedPage.tsx # 403 access denied page
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx # Login form
│   │   │   └── ActivationPage.tsx # Account activation form
│   │   ├── student/
│   │   │   ├── StudentDashboard.tsx # Student home page
│   │   │   ├── StudentAttendance.tsx
│   │   │   ├── StudentAccess.tsx
│   │   │   ├── StudentAlerts.tsx
│   │   │   ├── StudentAccount.tsx # Profile & settings
│   │   │   └── StudentSupport.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx # Admin home page
│   │       ├── AdminStudents.tsx
│   │       ├── AdminAttendance.tsx
│   │       ├── AdminAccess.tsx
│   │       ├── AdminIncidents.tsx
│   │       ├── AdminPresence.tsx
│   │       ├── AdminAlerts.tsx
│   │       └── AdminActivity.tsx
│   │
│   └── test/                 # Test utilities (placeholder)
│
├── public/
│   └── robots.txt           # SEO robots file
│
├── package.json             # Frontend dependencies
├── vite.config.ts           # Vite build config
├── vitest.config.ts         # Vitest test config
├── tsconfig.json            # TypeScript config
├── tsconfig.app.json        # App-specific TS config
├── tsconfig.node.json       # Node-specific TS config
├── postcss.config.js        # PostCSS config
├── tailwind.config.ts       # Tailwind CSS config
├── eslint.config.js         # ESLint config
├── playwright.config.ts     # Playwright E2E test config
├── playwright-fixture.ts    # Playwright fixtures
├── index.html               # HTML entry point
└── bun.lockb                # Bun lockfile (unused; using npm)
```

---

## Technology Stack

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js v18+ | JavaScript execution |
| **Language** | TypeScript 5+ | Type safety and developer experience |
| **HTTP Framework** | Fastify 4+ | High-performance, plugin-based REST API |
| **Logging** | Pino 8+ | Structured JSON logging |
| **Validation** | Zod 3+ | Runtime request/response schema validation |
| **CORS** | @fastify/cors 8+ | Cross-origin request handling |
| **Monorepo** | npm workspaces | Multi-package project management |
| **Build** | TypeScript Compiler | Compile TS to JS |
| **Dev Runtime** | ts-node | Execute TypeScript directly during development |
| **Dev Watcher** | nodemon | Auto-restart on file changes |

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Browser (ES2020+) | Rendering and interaction |
| **Language** | TypeScript 5+ | Type safety |
| **Framework** | React 19+ | UI component library |
| **Build Tool** | Vite 5+ | Fast dev server and optimized production builds |
| **Routing** | React Router 6+ | Client-side navigation |
| **State Management** | React Context API + localStorage | Auth state, user data, tokens |
| **Data Fetching** | TanStack React Query 5+ | Server state management, caching |
| **UI Components** | shadcn/ui + Radix UI | Accessible component primitives |
| **Styling** | Tailwind CSS 3+ | Utility-first CSS framework |
| **Theme** | next-themes | Dark mode support |
| **Forms** | react-hook-form + Zod | Form state and validation |
| **Notifications** | sonner | Toast notifications |
| **Icons** | lucide-react | SVG icon library |
| **Testing** | Vitest + Playwright | Unit and E2E tests |

### Shared

| Tool | Purpose |
|------|---------|
| **TypeScript** | Language for both backend and frontend type safety |
| **Zod** | Schema validation (backend routes, frontend form validation) |
| **ESLint** | Code linting and style consistency |

---

## Architecture

### High-Level Data Flow

```
User (Mobile/Web)
    ↓
Frontend (React/Vite)
    ├─ AuthContext (manages token, user, auth state)
    ├─ authApi.ts (login, activate, logout, deviceSwitch)
    ├─ apiClient.ts (HTTP calls, Bearer token injection)
    └─ localStorage (persists token, user, deviceId)
    ↓
    POST http://localhost:3000/auth/login
    ├─ { identifier, password, deviceId }
    └─ Bearer token in Authorization header
    ↓
Backend (Fastify)
    ├─ app.ts (registers plugins)
    ├─ plugins/auth.ts (service setup, decorates fastify.authService)
    ├─ routes/auth.ts (route handlers, Zod validation, error handling)
    ├─ services/auth-service.ts (business logic, throws AppError)
    └─ stores/mock-auth-store.ts (in-memory data, CRUD operations)
    ↓
    HTTP 200 or error response
    ├─ { accessToken, refreshToken, expiresIn, tokenType, user }
    └─ or { error: { code, message } }
    ↓
Frontend (continued)
    ├─ normalizeAuthResponse() (ensures user.name is always set)
    ├─ localStorage.setItem("nexus_token", token)
    ├─ localStorage.setItem("nexus_user", user)
    ├─ AuthContext updates: user, session, isAuthenticated
    └─ Router redirects to dashboard
```

### Mock vs. Real Data Strategy

**Auth Layer (Real Backend)**
- Login, activation, logout, device switch all hit real backend
- Real credential validation and device binding enforcement
- Token and user data stored in localStorage

**Dashboard Data Layers (Mock Data)**
- Attendance records, access events, incidents, alerts — all from `/mocks/data.ts`
- Backend routes exist but return placeholder messages
- Frontend components iterate over mock data arrays
- No network calls for dashboard data (yet)

### Frontend State Management

```
AuthContext (React Context)
├─ user: User | null
├─ session: Session | null
├─ isAuthenticated: boolean
├─ isLoading: boolean
├─ login(identifier, password): Promise<void>
├─ logout(): Promise<void>
├─ activate(token, password): Promise<void>
└─ switchDevice(deviceId): Promise<void>

localStorage
├─ nexus_token (Bearer token for API calls)
├─ nexus_user (Stringified User object)
├─ nexus_device_id (Unique device identifier, persistent)

Components
├─ ProtectedRoute (redirect to /login if !isAuthenticated)
├─ AppHeader (display user.name with safe fallbacks)
├─ AppSidebar (show student or admin nav based on user.role)
└─ Page Components (consume useAuth, render data)
```

### User-Shape Normalization

**Problem**: Backend returns `{ id, rollNumber, email, role }` but frontend User type expects `{ name, ... }`.

**Solution** (implemented in `authApi.ts` → `normalizeAuthResponse()`):

```typescript
function normalizeAuthResponse(backendResponse: AuthResponse): AuthResponse {
  const user = backendResponse.user;
  
  const normalizedUser = {
    ...user,
    id: user.id || user.studentId || `user-${Date.now()}`,
    name: user.name || user.studentId || user.email || "User",  // Constructive fallback
    status: user.status || "active",  // Default to active if missing
    studentId: user.studentId || user.id,
    // ... other fields with defaults
  };

  return {
    token: backendResponse.accessToken || backendResponse.token,
    accessToken: backendResponse.accessToken,
    refreshToken: backendResponse.refreshToken,
    expiresIn: backendResponse.expiresIn,
    tokenType: backendResponse.tokenType,
    user: normalizedUser,
    session: backendResponse.session,
  };
}
```

**Defensive Helpers** (in `lib/utils.ts`):

```typescript
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return "User";
  if (user.name) return user.name;
  if (user.studentId) return user.studentId;
  if (user.email) return user.email;
  return "User";
}

export function getUserInitials(user: User | null | undefined): string {
  if (!user) return "U";
  const displayName = getDisplayName(user);
  if (!displayName || displayName === "User") return "U";
  // Extract first letters: "John Doe" → "JD"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 2);
  return initials || "U";
}
```

**Usage** (in components like AppHeader, StudentAccount, etc.):

```typescript
<div className="flex h-8 w-8 items-center justify-center rounded-full">
  {getUserInitials(user)}
</div>
<p className="font-medium">{getDisplayName(user)}</p>
```

All 8 files that display user information now use these safe helpers, preventing crashes if `name` is undefined or user is null.

---

## Backend Documentation

### Server Boot Flow

**Entry Point**: `backend/api-gateway/src/server.ts`

```typescript
async function main() {
  const config = loadConfig();  // Load env/config
  const app = await createApp(); // Create Fastify app + register plugins/routes

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${config.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
```

**App Factory**: `backend/api-gateway/src/app.ts`

```typescript
export async function createApp() {
  const app = fastify({ logger: true });

  // Register CORS (allows localhost:8080, localhost:5173)
  await app.register(cors, {
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Register plugins and routes
  await app.register(authPlugin);      // Auth: login, activate, logout, switch
  await app.register(health);          // GET /health
  await app.register(students);        // Placeholder: GET /students/me
  await app.register(attendance);      // Placeholder: attendance routes
  await app.register(access);          // Placeholder: access check routes
  await app.register(presence);        // Placeholder: presence routes
  await app.register(incidents);       // Placeholder: incidents routes

  return app;
}
```

### Plugin Registration: Auth Example

**File**: `backend/api-gateway/src/plugins/auth.ts`

Auth plugin demonstrates the plugin pattern:

```typescript
const authPlugin: FastifyPluginAsync = async (fastify) => {
  // 1. Initialize store and service
  const store = new MockAuthStore();
  const authService = new AuthService(store);

  // 2. Decorate fastify instance (makes authService available in all routes)
  fastify.decorate('authService', authService);

  // 3. Register routes
  fastify.post('/auth/activate', async (request, reply) => {
    try {
      const body = ActivateRequestSchema.parse(request.body); // Zod validation
      const account = fastify.authService.activate(body.activationToken, body.password);
      return reply.code(200).send({
        message: 'Account activated successfully',
        account: { studentId: account.studentId, email: account.email, status: account.status },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.post('/auth/login', async (request, reply) => {
    try {
      const body = LoginRequestSchema.parse(request.body); // Zod validation
      const authResponse = fastify.authService.login(
        body.identifier,
        body.password,
        body.deviceId
      );
      return reply.code(200).send(authResponse);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // ... logout, device/switch routes ...
};

function handleError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map((i) => i.message).join(', '),
      },
    });
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  return reply.code(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export default authPlugin;
```

### Services & Stores

**AuthService** (`backend/api-gateway/src/services/auth-service.ts`):

Core business logic; depends on `MockAuthStore`:

```typescript
export class AuthService {
  constructor(private store: MockAuthStore) {}

  activate(activationToken: string, newPassword: string): StudentAccount {
    const account = this.store.getAccountByActivationToken(activationToken);
    if (!account) throw new AppError('INVALID_ACTIVATION_TOKEN', 400, '...');
    if (account.status === 'active') throw new AppError('ALREADY_ACTIVATED', 409, '...');
    
    account.status = 'active';
    account.activationToken = undefined;
    account.password = newPassword;
    return account;
  }

  login(identifier: string, password: string, deviceId: string): AuthResponse {
    const account = this.store.getAccountByEmailOrRollNumber(identifier);
    if (!account) throw new AppError('INVALID_CREDENTIALS', 401, '...');
    if (!this.store.validatePassword(account, password))
      throw new AppError('INVALID_CREDENTIALS', 401, '...');
    if (account.status === 'pending')
      throw new AppError('ACCOUNT_NOT_ACTIVATED', 403, '...');
    if (this.store.hasActiveDeviceSession(account.studentId))
      throw new AppError('DEVICE_ALREADY_BOUND', 409, '...');

    const session = this.store.createSession(account.studentId, deviceId);
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        rollNumber: account.rollNumber,
        email: account.email,
        role: 'student',
      },
    };
  }

  logout(studentId: string, deviceId: string): void {
    const account = this.store.getAccountById(studentId);
    if (!account) throw new AppError('ACCOUNT_NOT_FOUND', 404, '...');
    
    const session = this.store.getActiveDeviceSession(studentId);
    if (!session) throw new AppError('SESSION_NOT_FOUND', 404, '...');
    if (session.deviceId !== deviceId)
      throw new AppError('DEVICE_SWITCH_MISMATCH', 409, '...');

    this.store.invalidateSession(session.accessToken);
  }

  deviceSwitch(studentId: string, oldDeviceId: string, newDeviceId: string): AuthResponse {
    const account = this.store.getAccountById(studentId);
    if (!account) throw new AppError('ACCOUNT_NOT_FOUND', 404, '...');

    const oldSession = this.store.getActiveDeviceSession(studentId);
    if (!oldSession) throw new AppError('SESSION_NOT_FOUND', 404, '...');
    if (oldSession.deviceId !== oldDeviceId)
      throw new AppError('DEVICE_SWITCH_MISMATCH', 409, '...');

    this.store.invalidateSession(oldSession.accessToken);
    const newSession = this.store.createSession(studentId, newDeviceId);

    return {
      accessToken: newSession.accessToken,
      refreshToken: newSession.refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        rollNumber: account.rollNumber,
        email: account.email,
        role: 'student',
      },
    };
  }
}
```

**MockAuthStore** (`backend/api-gateway/src/stores/mock-auth-store.ts`):

Manages in-memory data:

```typescript
export class MockAuthStore {
  private accounts: Map<string, StudentAccount> = new Map();
  private sessions: Map<string, Session> = new Map(); // token → session
  private accountSessions: Map<string, Session> = new Map(); // "studentId:deviceId" → session

  constructor() {
    this.seed(); // Pre-load test accounts
  }

  private seed(): void {
    const account1: StudentAccount = {
      studentId: 'std_001',
      rollNumber: 'CS21001',
      email: 'cs21001@campus.edu',
      password: 'pass123',
      status: 'pending',
      activationToken: 'activation_token_001',
    };

    const account2: StudentAccount = {
      studentId: 'std_002',
      rollNumber: 'CS21002',
      email: 'cs21002@campus.edu',
      password: 'pass456',
      status: 'active',
    };

    this.accounts.set(account1.studentId, account1);
    this.accounts.set(account2.studentId, account2);
  }

  getAccountByEmailOrRollNumber(identifier: string): StudentAccount | null {
    for (const account of this.accounts.values()) {
      if (account.email === identifier || account.rollNumber === identifier) {
        return account;
      }
    }
    return null;
  }

  getAccountById(studentId: string): StudentAccount | null {
    return this.accounts.get(studentId) || null;
  }

  getAccountByActivationToken(token: string): StudentAccount | null {
    for (const account of this.accounts.values()) {
      if (account.activationToken === token) {
        return account;
      }
    }
    return null;
  }

  validatePassword(account: StudentAccount, password: string): boolean {
    return account.password === password; // Currently plaintext; TODO: hash
  }

  createSession(studentId: string, deviceId: string): Session {
    const id = randomUUID();
    const accessToken = randomUUID();
    const refreshToken = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min

    const session: Session = {
      id,
      studentId,
      deviceId,
      accessToken,
      refreshToken,
      createdAt: now,
      expiresAt,
    };

    this.sessions.set(accessToken, session);
    this.sessions.set(refreshToken, session);
    this.accountSessions.set(`${studentId}:${deviceId}`, session);

    return session;
  }

  getSessionByAccessToken(token: string): Session | null {
    return this.sessions.get(token) || null;
  }

  hasActiveDeviceSession(studentId: string): boolean {
    for (const key of this.accountSessions.keys()) {
      if (key.startsWith(studentId + ':')) {
        return true;
      }
    }
    return false;
  }

  getActiveDeviceSession(studentId: string): Session | null {
    for (const [key, session] of this.accountSessions.entries()) {
      if (key.startsWith(studentId + ':')) {
        return session;
      }
    }
    return null;
  }

  invalidateSession(accessToken: string): void {
    const session = this.sessions.get(accessToken);
    if (session) {
      this.sessions.delete(accessToken);
      this.sessions.delete(session.refreshToken);
      this.accountSessions.delete(`${session.studentId}:${session.deviceId}`);
    }
  }

  switchDevice(
    studentId: string,
    oldDeviceId: string,
    newDeviceId: string
  ): { oldSession: Session; newSession: Session } {
    const oldSessionKey = `${studentId}:${oldDeviceId}`;
    const oldSession = this.accountSessions.get(oldSessionKey);

    if (!oldSession) {
      throw new AppError('DEVICE_SWITCH_MISMATCH', 400, '...');
    }

    this.invalidateSession(oldSession.accessToken);
    const newSession = this.createSession(studentId, newDeviceId);

    return { oldSession, newSession };
  }
}
```

### Seeded Test Accounts

**Available for testing** (in MockAuthStore.seed()):

| Roll # | Email | Password | Status | Activation Token |
|--------|-------|----------|--------|------------------|
| CS21001 | cs21001@campus.edu | pass123 | pending | activation_token_001 |
| CS21002 | cs21002@campus.edu | pass456 | **active** | (none) |

To test the flow:
1. First, activate account 1 with token `activation_token_001`, set a new password
2. Then, log in as account 2 (already active) using `pass456`

---

## Frontend Documentation

### App Structure

**Main Entry**: `src/App.tsx`

Define all routes and role-based routing:

```typescript
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  const isAdmin = user.role === "admin" || user.role === "security";
  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/activate" element={<ActivationPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              {/* ... student and admin routes ... */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### AuthContext & State Management

**File**: `src/contexts/AuthContext.tsx`

Manages user authentication state with localStorage persistence:

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  activate: (token: string, password: string) => Promise<void>;
  switchDevice: (deviceId: string) => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load persisted state on mount
  useEffect(() => {
    const token = getAuthToken();
    const savedUser = localStorage.getItem("nexus_user");
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setState({
          user,
          session: null,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    setState({
      user: res.user,
      session: res.session || null,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const activate = useCallback(async (token: string, password: string) => {
    const res = await authApi.activateAccount(token, password);
    setState({
      user: res.user,
      session: res.session || null,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const switchDevice = useCallback(async (deviceId: string) => {
    await authApi.switchDevice(deviceId);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, activate, switchDevice }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

### API Client

**File**: `src/services/apiClient.ts`

Low-level HTTP client with token management:

```typescript
const DEVICE_ID_KEY = "nexus_device_id";

let authToken: string | null = localStorage.getItem("nexus_token");

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY);
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("nexus_token", token);
  } else {
    localStorage.removeItem("nexus_token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${ENV.API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${ENV.API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}
```

### Auth API Service

**File**: `src/services/authApi.ts`

High-level auth API methods; handles normalization:

```typescript
const USE_MOCK = false; // Toggle to false for real backend

function normalizeAuthResponse(backendResponse: AuthResponse): AuthResponse {
  const user = backendResponse.user;
  
  const normalizedUser = {
    ...user,
    id: user.id || user.studentId || `user-${Date.now()}`,
    name: user.name || user.studentId || user.email || "User",
    status: user.status || "active",
    studentId: user.studentId || user.id,
    department: user.department || undefined,
    avatarUrl: user.avatarUrl || undefined,
    phone: user.phone || undefined,
    createdAt: user.createdAt || new Date().toISOString(),
    lastLogin: user.lastLogin || new Date().toISOString(),
  };

  return {
    token: backendResponse.accessToken || backendResponse.token,
    accessToken: backendResponse.accessToken,
    refreshToken: backendResponse.refreshToken,
    expiresIn: backendResponse.expiresIn,
    tokenType: backendResponse.tokenType,
    user: normalizedUser,
    session: backendResponse.session,
  };
}

export const authApi = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      // Mock implementation
      await new Promise((r) => setTimeout(r, 800));
      if (password !== "password")
        throw { message: "Invalid credentials", status: 401 };
      const isAdmin = identifier.includes("admin") || identifier.includes("osei");
      const user = isAdmin ? mockAdminUser : mockStudentUser;
      const token = `mock-token-${user.role}-${Date.now()}`;
      setAuthToken(token);
      localStorage.setItem("nexus_user", JSON.stringify(user));
      return {
        token,
        user,
        session: { ...mockSession, userId: user.id },
      };
    }

    // Real backend
    const deviceId = getOrCreateDeviceId();
    const res = await apiPost<AuthResponse>("/auth/login", {
      identifier,
      password,
      deviceId,
    });

    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));
    return normalized;
  },

  async activateAccount(
    activationToken: string,
    password: string
  ): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      const res: AuthResponse = {
        token: `mock-token-${Date.now()}`,
        user: mockStudentUser,
        session: mockSession,
      };
      setAuthToken(res.token!);
      localStorage.setItem("nexus_user", JSON.stringify(res.user));
      return res;
    }

    const res = await apiPost<AuthResponse>("/auth/activate", {
      activationToken,
      password,
    });

    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));
    return normalized;
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      setAuthToken(null);
      localStorage.removeItem("nexus_user");
      return;
    }

    const user = localStorage.getItem("nexus_user");
    const deviceId = getDeviceId();

    if (user && deviceId) {
      try {
        const parsedUser = JSON.parse(user);
        await apiPost("/auth/logout", {
          studentId: parsedUser.id,
          deviceId,
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      }
    }

    setAuthToken(null);
    localStorage.removeItem("nexus_user");
  },

  async switchDevice(deviceId: string): Promise<AuthResponse> {
    const user = localStorage.getItem("nexus_user");
    if (!user)
      throw new Error("No authenticated user");

    const parsedUser = JSON.parse(user);
    const oldDeviceId = getDeviceId();

    if (!oldDeviceId)
      throw new Error("No device ID found");

    const res = await apiPost<AuthResponse>("/auth/device/switch", {
      studentId: parsedUser.id,
      oldDeviceId,
      newDeviceId: deviceId,
    });

    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));
    return normalized;
  },
};
```

### Component Examples

**AppHeader** (`src/components/layout/AppHeader.tsx`):

Uses safe helpers to display user info:

```typescript
import { getDisplayName, getUserInitials } from "@/lib/utils";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/80 px-4">
      {/* ... search and notifications ... */}
      <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {getUserInitials(user)}
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-medium leading-none">{getDisplayName(user)}</p>
          <StatusBadge variant={user?.role === "admin" ? "info" : "default"}>
            {user?.role}
          </StatusBadge>
        </div>
      </div>
    </header>
  );
}
```

**Protected Route** (`src/components/layout/ProtectedRoute.tsx`):

Guard against unauthenticated access:

```typescript
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <AppLayout />;
}
```

---

## API Routes & Endpoints

### Organization

Routes are currently grouped by domain but many are stubbed. Only **Auth** is fully functional.

### Auth Domain

| Method | Path | Status | Request Body | Response | Notes |
|--------|------|--------|--------------|----------|-------|
| **POST** | `/auth/activate` | ✅ Complete | `{ activationToken, password }` | `{ message, account }` | Activate pending account with token |
| **POST** | `/auth/login` | ✅ Complete | `{ identifier, password, deviceId }` | `{ accessToken, refreshToken, expiresIn, tokenType, user }` | Login by roll# or email; binds device |
| **POST** | `/auth/logout` | ✅ Complete | `{ studentId, deviceId }` | `{ message }` | Invalidate session |
| **POST** | `/auth/device/switch` | ✅ Complete | `{ studentId, oldDeviceId, newDeviceId }` | `{ accessToken, ... }` | Move session to new device |

#### Error Codes (Auth)

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_CREDENTIALS` | 401 | Email/roll or password incorrect |
| `ACCOUNT_NOT_ACTIVATED` | 403 | Account status is 'pending' |
| `ACCOUNT_NOT_FOUND` | 404 | Student ID not found |
| `SESSION_NOT_FOUND` | 404 | No active session |
| `DEVICE_ALREADY_BOUND` | 409 | Another device has active session |
| `DEVICE_SWITCH_MISMATCH` | 409 | Old device ID doesn't match session |
| `INVALID_ACTIVATION_TOKEN` | 400 / 404 | Token invalid or already used |
| `ALREADY_ACTIVATED` | 409 | Account already active |

### Health

| Method | Path | Status | Request | Response |
|--------|------|--------|---------|----------|
| **GET** | `/health` | ✅ Implemented | (none) | `{ status: 'ok', timestamp }` |

### Students (Stubbed)

| Method | Path | Status | Request | Response |
|--------|------|--------|---------|----------|
| **GET** | `/students/me` | ⏳ Stubbed | (none) | `{ id, rollNumber, name, email, ... }` (hardcoded mock) |

### Attendance (Stubbed)

| Method | Path | Status | Request | Response |
|--------|------|--------|---------|----------|
| **GET** | `/students/:studentId/attendance` | ⏳ Stubbed | (none) | `{ message: '...' }` |
| **POST** | `/students/:studentId/attendance` | ⏳ Stubbed | `{ ... }` | `{ message: '...' }` |

### Access (Stubbed)

| Method | Path | Status | Request | Response |
|--------|------|--------|---------|----------|
| **GET** | `/access/:studentId` | ⏳ Stubbed | (none) | `{ message: '...' }` |
| **POST** | `/access/check` | ⏳ Stubbed | `{ ... }` | `{ message: '...' }` |

### Presence (Stubbed)

| Method | Path | Status | Request | Response |
|--------|------|--------|---------|----------|
| **GET** | `/presence/:studentId` | ⏳ Stubbed | (none) | `{ message: '...' }` |
| **GET** | `/presence/:studentId/trail` | ⏳ Stubbed | (none) | `{ message: '...' }` |

### Incidents (Stubbed)

| Method | Path | Status | Request | Response |
|--------|------|--------|---------|----------|
| **GET** | `/incidents` | ⏳ Stubbed | (none) | `{ message: '...' }` |
| **POST** | `/incidents` | ⏳ Stubbed | `{ ... }` | `{ message: '...' }` |

---

## Schemas & Contracts

### Backend Request Schemas (Zod)

**File**: `backend/api-gateway/src/schemas/auth.ts`

```typescript
export const ActivateRequestSchema = z.object({
  activationToken: z.string().min(1, "Activation token required"),
  password: z.string().min(1, "Password required"),
});

export const LoginRequestSchema = z.object({
  identifier: z.string().min(1, "Identifier required"),
  password: z.string().min(1, "Password required"),
  deviceId: z.string().min(1, "Device ID required"),
});

export const LogoutRequestSchema = z.object({
  studentId: z.string().min(1, "Student ID required"),
  deviceId: z.string().min(1, "Device ID required"),
});

export const DeviceSwitchRequestSchema = z.object({
  studentId: z.string().min(1, "Student ID required"),
  oldDeviceId: z.string().min(1, "Old device ID required"),
  newDeviceId: z.string().min(1, "New device ID required"),
});
```

### Backend Core Types

**File**: `backend/core/src/types/index.ts`

```typescript
export interface User {
  id: string;
  role: 'student' | 'security' | 'admin';
  email?: string;
  status?: AccountStatus;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
}

export type AccountStatus = 'pending' | 'active';

export interface StudentAccount {
  studentId: string;
  rollNumber: string;
  email: string;
  password: string; // plain text; will hash later
  status: AccountStatus;
  activationToken?: string;
}

export interface Session {
  id: string;
  studentId: string;
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

### Frontend Types

**File**: `frontend/web-dashboard/.../src/types/index.ts`

```typescript
export type UserRole = "student" | "admin" | "security";

export interface User {
  id: string;
  name: string;  // Normalized by authApi; always has a value
  email: string;
  role: UserRole;
  status: "active" | "suspended" | "inactive" | "pending";
  department?: string;
  studentId?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet";
  ipAddress: string;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

export interface AuthResponse {
  token?: string; // From mock responses
  accessToken?: string; // From backend
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user: User;
  session?: Session;
}

export type ApiError = {
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  status?: number;
};
```

### Response Examples

**Successful Login**:

```json
{
  "accessToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "refreshToken": "r1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "std_002",
    "rollNumber": "CS21002",
    "email": "cs21002@campus.edu",
    "role": "student"
  }
}
```

**Failed Login (Invalid Credentials)**:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid roll number/email or password"
  }
}
```

**Device Already Bound**:

```json
{
  "error": {
    "code": "DEVICE_ALREADY_BOUND",
    "message": "Another device is already bound to this account"
  }
}
```

---

## Authentication & Authorization

### Authentication Flow

#### 1. Account Activation (First Time)

Admin creates an account with a unique activation token sent via email.

```
Student receives email with: token = "activation_token_001"

POST /auth/activate
{
  "activationToken": "activation_token_001",
  "password": "student_chosen_password"
}

Response:
{
  "message": "Account activated successfully",
  "account": {
    "studentId": "std_001",
    "email": "cs21001@campus.edu",
    "status": "active"
  }
}

Account status: pending → active
Activation token cleared
Password now set
```

#### 2. Login (Device Binding)

Student logs in on a device; single device session created.

```
POST /auth/login
{
  "identifier": "CS21001",      // (roll number)
  "password": "student_chose_password",
  "deviceId": "ios-iphone-15"   // (unique per device)
}

Response:
{
  "accessToken": "uuid-token",
  "refreshToken": "uuid-refresh",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "std_001",
    "rollNumber": "CS21001",
    "email": "cs21001@campus.edu",
    "role": "student"
  }
}

Session created: stores accessToken, refreshToken, deviceId, 15-min expiry
```

#### 3. One-Device Policy

Attempting to log in on a second device while first is still active:

```
POST /auth/login
{
  "identifier": "CS21001",
  "password": "...",
  "deviceId": "android-pixel-8"  // Different device
}

Response: (409 Conflict)
{
  "error": {
    "code": "DEVICE_ALREADY_BOUND",
    "message": "Another device is already bound to this account"
  }
}

Session creation blocked; student must either logout first or switch devices
```

#### 4. Device Switching (Atomic)

Student moves active session to a new device without logging out first:

```
POST /auth/device/switch
{
  "studentId": "std_001",
  "oldDeviceId": "ios-iphone-15",
  "newDeviceId": "android-pixel-8"
}

Actions:
1. Find student account
2. Find active session on oldDeviceId
3. Validate oldDeviceId matches
4. Invalidate old session (delete tokens)
5. Create new session on newDeviceId
6. Return new tokens

Response:
{
  "accessToken": "new-uuid-token",
  "refreshToken": "new-uuid-refresh",
  ...
}

Result: Session now on android-pixel-8; ios-iphone-15 is no longer bound
```

#### 5. Logout

Student explicitly ends session:

```
POST /auth/logout
{
  "studentId": "std_001",
  "deviceId": "ios-iphone-15"
}

Result: Session invalidated; device is unbound
Tokens deleted from store
Student can now login on a different device
```

### Token & Session Management

**Current State (Development)**:

- **Token Format**: Random UUID (no cryptographic security)
- **Token Lifetime**: 15 minutes (`expiresAt = now + 15 min`)
- **Storage**: In-memory `MockAuthStore` (lost on server restart)
- **Validation**: Not implemented (tokens not validated on subsequent requests)
- **Refresh**: Not implemented

**Future (Production)**:

- **Token Format**: JWT with RS256 signing
- **Token Lifetime**: 15 min access, 7 day refresh
- **Storage**: Redis or database (persistent)
- **Validation**: Middleware on protected routes checks Bearer token + expiry
- **Refresh**: Client can use refresh token to get new access token

### Frontend Token Persistence

**localStorage Keys**:

| Key | Value | Expires |
|-----|-------|---------|
| `nexus_token` | Bearer token (UUID string) | Never (until logout or tab close) |
| `nexus_user` | Stringified User object | Never |
| `nexus_device_id` | Device identifier string | Never (same device, same ID) |

**On App Load** (`AuthContext` useEffect):

```typescript
useEffect(() => {
  const token = getAuthToken();
  const savedUser = localStorage.getItem("nexus_user");
  
  if (token && savedUser) {
    // Restore state from localStorage
    const user = JSON.parse(savedUser) as User;
    setState({ user, isAuthenticated: true, isLoading: false });
  } else {
    // No persisted session; user logged out
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }
}, []);
```

### Authorization

**Current State**:

- No authorization middleware on backend routes
- All routes are publicly accessible (no Bearer token validation)
- Frontend uses `user.role` to route to student or admin dashboard
- Backend always returns `role: 'student'` (hardcoded)

**Gaps**:

1. Backend doesn't verify Bearer token on protected routes
2. Backend only creates `student` role; no provision for `admin` or `security`
3. Frontend assumes role from token but no validation on backend
4. Admin dashboard fully accessible to anyone who logs in as student

**To Fix**:

1. Add middleware to validate Bearer token before route handler
2. Add role column to StudentAccount; return actual role from login
3. Add route-level authorization checks (e.g., `@protected("admin")`)
4. Frontend should validate role before rendering admin pages (already done)

---

## Local Development

### Prerequisites

- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later (comes with Node; supports workspaces)
- **Git**: For version control

Verify:

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
git --version
```

### Installation

```bash
# 1. Clone the repo (or navigate to workspace)
cd /path/to/nexus

# 2. Install all dependencies (backend + frontend)
npm install

# This installs both @nexus/core and @nexus/api-gateway from backend/,
# and the frontend from frontend/web-dashboard/campus-guardian-dashboard-main/
```

### Starting the Backend

```bash
# Terminal 1: Start backend dev server (watches for changes)
npm run dev

# Output:
# > @nexus/api-gateway dev
# [timestamp] INFO: Fastify server listening on port 3000
# [timestamp] DEBUG: AuthRoute: Plugin registered
# ...
```

Backend now running at `http://localhost:3000`

### Starting the Frontend

```bash
# Terminal 2: Navigate to frontend and start dev server
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev

# Output:
# vite v5.4.19 dev server running at:
# ➜  Local:   http://localhost:8080/
# ➜  Network: use `--host` to access from network
```

Frontend now running at `http://localhost:8080`

### Configuration

#### Frontend API URL

**File**: `frontend/web-dashboard/.../src/config/env.ts`

Default is `http://localhost:3000`:

```typescript
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  get apiUrl() {
    return this.API_BASE_URL;
  },
} as const;
```

Override via environment variable:

```bash
VITE_API_BASE_URL=http://api.example.com npm run dev
```

#### Mock vs. Real Auth

**File**: `frontend/web-dashboard/.../src/services/authApi.ts`

Toggle auth source:

```typescript
const USE_MOCK = false; // Change to `true` to use mock data
```

- `USE_MOCK = false` (default): Real backend at `http://localhost:3000`
- `USE_MOCK = true`: Simulated auth with mock data (hardcoded credentials)

### Testing

#### Manual API Testing with REST Client

**File**: `test.http`

Uses VS Code REST Client extension. Open `test.http` and click "Send Request":

```http
### Health check
GET http://localhost:3000/health

### Login (active account, works immediately)
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "identifier": "CS21002",
  "password": "pass456",
  "deviceId": "test-device-1"
}

### Activate (pending account)
POST http://localhost:3000/auth/activate
Content-Type: application/json

{
  "activationToken": "activation_token_001",
  "password": "newpassword123"
}

### Login after activation
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "identifier": "CS21001",
  "password": "newpassword123",
  "deviceId": "test-device-2"
}
```

#### Build Verification

```bash
# Build all packages
npm run build

# Output:
# > nexus build
# ... (core built successfully)
# ... (api-gateway built successfully)
# frontend builds with `npm run build` separately

# Frontend build
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run build

# Output:
# vite v5.4.19 building for production...
# dist/index.html                   1.13 kB
# dist/assets/index-K-oT-CG6.css   63.94 kB
# dist/assets/index-DMfYDGCJ.js   444.10 kB
# ✓ built in 2.75s
```

#### Linting

```bash
# Lint all TypeScript files
npm run lint

# Output: (shows any ESLint violations)
# If clean, exits with code 0
```

### Inspecting Local Data

#### localStorage

In browser console:

```javascript
// Check stored token
localStorage.getItem('nexus_token')

// Check stored user object
JSON.parse(localStorage.getItem('nexus_user'))

// Check device ID
localStorage.getItem('nexus_device_id')

// Clear all (logout)
localStorage.clear()
```

#### Network Requests

In browser DevTools (Network tab):

1. Open DevTools (F12)
2. Go to Network tab
3. Filter to "Fetch/XHR"
4. Perform a login action
5. Click on `/auth/login` request
6. View Request body, Response, Headers

#### Backend Logs

In backend terminal:

```bash
# Fastify logs all requests in Pino JSON format
# Example output:
# {"level":20,"time":1701234567000,"pid":12345,"msg":"POST /auth/login","req":{"method":"POST","url":"/auth/login",...},...}

# Pretty-print with pino-pretty (optional):
npm install --save-dev pino-pretty
npm run dev | npx pino-pretty
```

### Creating Test Accounts

**Seeded accounts** (MockAuthStore):

```
Roll: CS21001, Email: cs21001@campus.edu
  - Password: pass123
  - Status: pending
  - Token: activation_token_001
  
Roll: CS21002, Email: cs21002@campus.edu
  - Password: pass456
  - Status: active (ready to login)
```

**To test activation**:

1. Call `/auth/activate` with `activationToken: "activation_token_001"`
2. Set new password (e.g., "newpass123")
3. Now can login as CS21001 with new password

**To add new accounts**:

Edit `backend/api-gateway/src/stores/mock-auth-store.ts`:

```typescript
private seed(): void {
  const account3: StudentAccount = {
    studentId: 'std_003',
    rollNumber: 'CS21003',
    email: 'cs21003@campus.edu',
    password: 'pass789',
    status: 'active',
  };
  this.accounts.set(account3.studentId, account3);
}
```

Restart backend; account is now available.

---

## Testing & Verification

### Backend Tests

#### Unit Tests (Future)

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

Currently: No unit tests implemented.

#### Manual Verification

**Flow 1: Successful Login**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "CS21002",
    "password": "pass456",
    "deviceId": "device-1"
  }'

# Expected: 200 OK with tokens and user
```

**Flow 2: Device Already Bound**

```bash
# First login (establishes binding)
curl ... /auth/login -d '{...,"deviceId":"device-1"}' # Success

# Second login with different device ID
curl ... /auth/login -d '{...,"deviceId":"device-2"}' 
# Expected: 409 with code "DEVICE_ALREADY_BOUND"
```

**Flow 3: Device Switch**

```bash
# Atomically move session
curl -X POST http://localhost:3000/auth/device/switch \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "std_002",
    "oldDeviceId": "device-1",
    "newDeviceId": "device-2"
  }'

# Expected: 200 OK with new tokens
```

### Frontend Tests

#### Build & Type Check

```bash
cd frontend/web-dashboard/campus-guardian-dashboard-main

# Type checking
npx tsc --noEmit

# Build
npm run build

# Preview built app (serves dist/)
npm run preview
```

#### Manual E2E Flow

1. **Open frontend**: `http://localhost:8080`
2. **Click "Login"**: Navigate to `/login`
3. **Enter credentials**: "CS21002" / "pass456"
4. **Click "Sign in"**: Makes real `/auth/login` call
5. **Check localStorage**: Token should be set
6. **See dashboard**: Student or Admin based on role
7. **Click logout**: Clears token, redirects to login

### Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Cannot connect to backend" | Backend not running on :3000 | `npm run dev` in backend/ |
| CORS error in console | Frontend port not in CORS allowlist | Update `app.ts` CORS config |
| "Invalid credentials" | Wrong password or roll# typo | Use CS21002/pass456 |
| "Device already bound" | Another device has session | Logout first or use device/switch |
| Blank dashboard after login | Mock data toggle is on | Check `USE_MOCK` flag in authApi |
| Page refresh loses auth | Token not persisting | Check localStorage; clear and login again |
| Tokens not in localStorage | Auth toggle is `USE_MOCK = true` | Set to `false` for real backend |

---

## Known Issues & Gaps

### Backend

#### 1. No Route Protection / Auth Middleware
- **Issue**: All backend routes (including stubbed ones) are publicly accessible
- **Impact**: Anyone can call any endpoint without valid Bearer token
- **Status**: Blocker for production
- **Fix**: Implement middleware to validate `Authorization: Bearer <token>` header

#### 2. Role Hardcoding
- **Issue**: Backend always returns `role: 'student'` in auth response
- **Impact**: Admin/security roles exist on frontend UI but aren't returned by backend
- **Status**: Blocker for role-based access control
- **Fix**: Store role in StudentAccount; return from login response

#### 3. No Cryptographic Token Security
- **Issue**: Access tokens are random UUIDs, not signed JWTs
- **Impact**: Tokens can be forged; no way to verify authenticity without database lookup
- **Status**: Security gap
- **Fix**: Implement JWT with RS256 signing

#### 4. No Token Expiration Validation
- **Issue**: Tokens expire at 15 min but expiration not checked on API calls
- **Impact**: Old tokens still work indefinitely
- **Status**: Security gap
- **Fix**: Middleware should reject expired tokens

#### 5. Stubbed Routes Without Error Responses
- **Issue**: GET /students/:id returns random mock student, not 403/404
- **Impact**: Inconsistent API contract; frontend can't distinguish real from stubbed
- **Status**: Design gap
- **Fix**: Either implement routes fully or return explicit "not implemented" error

#### 6. Plaintext Passwords in Store
- **Issue**: MockAuthStore stores passwords as plaintext in memory
- **Impact**: Any server compromise leaks credentials
- **Status**: Development-only; unacceptable for production
- **Fix**: Hash passwords with bcrypt before storing

#### 7. No Persistent Storage
- **Issue**: All data is in-memory; lost on server restart
- **Impact**: Sessions, accounts, test data all disappear
- **Status**: Development-only limitation
- **Fix**: Implement MongoDB/PostgreSQL integration

#### 8. CORS Hardcoded
- **Issue**: `app.ts` cors config lists specific localhost ports
- **Impact**: Can't easily change frontend port or deploy to different domain
- **Status**: Not blocking for local dev; needs env-based config
- **Fix**: Move allowed origins to `.env` file

### Frontend

#### 1. No Route-Level Authorization
- **Issue**: Admin dashboard accessible to any authenticated user (frontend only)
- **Impact**: If attacker is authenticated as student, can view admin UI (backend still blocks)
- **Status**: Low risk (backend doesn't authorize); minor UX issue
- **Fix**: Already not rendering admin dashboard for non-admin users; good practice to keep

#### 2. No Token Expiration Handling
- **Issue**: Frontend doesn't refresh expired tokens or prompt for re-login
- **Impact**: After 15 min, all API calls fail silently
- **Status**: Blocker for production
- **Fix**: Implement token refresh flow or redirect to login on 401

#### 3. Dashboard Data Not Wired to Backend
- **Issue**: Attendance, access, incidents, alerts all use mock data
- **Impact**: No real data flowing to UI; only auth integration works
- **Status**: Expected (backend routes stubbed); prioritize once backend APIs ready
- **Fix**: Replace `mockAttendanceRecords` iterators with `useQuery` calls

#### 4. No Error Boundary
- **Issue**: If component throws, entire app crashes
- **Impact**: User sees blank white screen
- **Status**: UX gap; not impacting auth
- **Fix**: Add React Error Boundary wrapper

#### 5. No Logout Confirmation
- **Issue**: Logout happens immediately without warning
- **Impact**: Accidental clicks delete session
- **Status**: Minor UX gap
- **Fix**: Add confirmation dialog before logout

---

## Roadmap & Next Steps

### Immediate (Next Sprint)

1. **Add Backend Route Protection**
   - Implement middleware to validate Bearer token on protected routes
   - Return 401 Unauthorized for missing/invalid tokens
   - Apply to all non-auth routes

2. **Add Role-Based Authorization**
   - Add `role` column to StudentAccount in MockAuthStore
   - Return actual role from login response
   - Implement route-level checks (e.g., admin-only endpoints)

3. **Implement Attendance Business Logic**
   - Create AttendanceService with schedule validation
   - Implement POST /students/:id/attendance to mark attendance
   - Perform location, schedule, and grace-window checks
   - Return attendance record or validation error

4. **Wire Frontend Dashboard to Real Backend**
   - Replace mock data with API calls for attendance records
   - Replace mock data with API calls for access events
   - Use TanStack React Query for data fetching and caching

### Short-term (Month 2-3)

5. **Database Persistence**
   - Integrate MongoDB or PostgreSQL
   - Migrate MockAuthStore to database queries
   - Implement migrations for schema evolution

6. **Token Security**
   - Implement JWT signing with RS256
   - Implement token refresh flow
   - Add token expiration validation middleware
   - Frontend should refresh tokens transparently

7. **Complete Attendance Domain**
   - Implement schedule service (student timetables, campus events)
   - Implement grace windows (configurable per campus)
   - Integrate location validation (GPS/BLE checking)

8. **Implement Access Verification**
   - Define campus topology (zones, buildings, gates, parking)
   - Implement access policies and rules
   - Create access logging and reporting

### Medium-term (Month 4-6)

9. **Location & Presence Tracking**
   - Implement GPS ingestion pipeline
   - Implement BLE mesh integration
   - Implement offline batch upload (DOLN)
   - Reconstruct movement trails

10. **Incident Management**
    - Implement incident creation and workflow
    - Implement alert generation rules
    - Build incident dashboard for security team

11. **Mobile App**
    - Create React Native app or Flutter app
    - Implement campus entry scanning (QR/NFC)
    - Implement attendance marking with location
    - Implement offline support

12. **Real-time Features**
    - Implement WebSocket support (Fastify WS plugin)
    - Push alerts to dashboard in real-time
    - Update presence state as student locations update

### Long-term (Month 7+)

13. **Reliability Scoring**
    - Implement behavioral signal aggregation
    - Implement anomaly detection rules
    - Compute reliability/risk scores per student

14. **Advanced Security**
    - Implement two-factor authentication (TOTP/SMS)
    - Implement audit logging for admin actions
    - Implement role-based access matrix

15. **Scale & Operations**
    - Implement caching (Redis) for hot data
    - Implement distributed tracing / observability
    - Implement health checks and monitoring
    - Containerize and deploy (Docker/Kubernetes)

---

## Contributing / Developer Notes

### Adding a New Backend Route

1. **Create a store** (if needed): `stores/domain-store.ts`
   - Manage data operations
   - Use in-memory for now; migrate to DB later

2. **Create a service** (if needed): `services/domain-service.ts`
   - Business logic
   - Throw `AppError` on failures

3. **Create Zod schemas**: `schemas/domain.ts`
   - Request/response shapes
   - Validation rules

4. **Create a plugin or add to existing**: `plugins/domain.ts` or `plugins/auth.ts`
   - Initialize store and service
   - Decorate fastify instance
   - Register route handlers

5. **Register in app.ts**:
   ```typescript
   await app.register(domainPlugin);
   ```

6. **Add types to backend/core** if they're shared with frontend
   - Update `backend/core/src/types/index.ts`
   - Export from `backend/core/src/index.ts`

7. **Test with REST Client** (`test.http`)
   - Add test requests
   - Verify happy path and error cases

### Adding a New Frontend Page

1. **Create the page component**: `src/pages/domain/DomainPage.tsx`
   - Use hooks like `useAuth()`, `useQuery()`, etc.
   - Import shared components from `components/shared/`

2. **Update router**: `src/App.tsx`
   - Add route entry
   - Wrap with `<ProtectedRoute>` if auth required
   - Add to nav items if needed

3. **Create/update layout**: `src/components/layout/`
   - Ensure compatible with AppLayout, AppHeader, AppSidebar

4. **Use mock data** or call backend via apiClient
   - If calling backend, ensure route is implemented
   - Use TanStack React Query for larger data fetches

5. **Add types** if introducing new domain objects
   - Update `src/types/index.ts`

### Keeping Frontend & Backend in Sync

1. **Shared Types**
   - Backend exports types via `@nexus/core`
   - Frontend imports from `@nexus/core` when directly consuming (currently only used in backend)
   - **If** backend types are shared with frontend in future:
     - Install `@nexus/core` in frontend package.json
     - Import: `import { StudentAccount } from '@nexus/core'`

2. **API Contracts**
   - Document request/response shapes in README (or API_CONTRACTS.md)
   - Run `test.http` tests whenever API changes
   - Update frontend `src/types/index.ts` to match API response shape

3. **Error Codes**
   - Backend returns error codes (e.g., `DEVICE_ALREADY_BOUND`)
   - Frontend should handle known codes with appropriate messages
   - Example: `if (error.error?.code === 'INVALID_CREDENTIALS') { showToast('...') }`

### Code Style

- **TypeScript**: Strict mode enabled; no implicit `any`
- **Backend**: Services encapsulate logic; stores handle data
- **Frontend**: Components are functional; use hooks
-  **Names**: camelCase for variables/functions; PascalCase for components/classes
- **Comments**: Explain *why*, not *what*; code should be self-documenting

---

## Summary

**NEXUS is a full-stack campus intelligence platform** with:

- ✅ **Working**: Student authentication, device binding, account activation
- ✅ **Integrated**: Real backend + frontend login flow with localStorage persistence
- ✅ **Stubbed**: Attendance, access, incidents, presence routes (ready for implementation)
- ⏳ **Missing**: Database persistence, token security, route protection, dashboard backend wiring

**To start developing**:

```bash
npm install
npm run dev                    # Backend on :3000
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev                    # Frontend on :8080
```

**Next priority**: Add route protection middleware + wire dashboard data to backend APIs.

---

**Last Updated**: April 3, 2026
