# NEXUS – Unified Intelligent Campus Security System

**NEXUS** is a unified backend platform that combines **student attendance**, **access verification**, and **campus security monitoring** into a single, integrated system. Designed for resilience, offline capability, and future extensibility, NEXUS provides campus administrators and security teams with real-time visibility into student presence, access patterns, and behavioral anomalies.

## Overview

### What is NEXUS?

NEXUS is the backend for a unified campus security and attendance platform that serves:

- **Students** via a mobile app to:
  - Verify campus entry and parking access (QR/NFC/digital credentials)
  - Mark class attendance based on geolocation and proximity signals
  - Manage device bindings and sessions

- **Campus Security & Admins** via a web dashboard to:
  - Look up students by roll number and inspect their real-time status
  - Monitor unusual locations and loitering patterns
  - Track behavioral reliability scores and risk signals
  - Create, manage, and audit security incidents

### Core Goals

1. **Resilient**: Offline-capable presence tracking with deferred synchronization (DOLN — Delay Optimized Local Network)
2. **Secure**: Admin-provisioned accounts only; no public self-signup; structured device session management
3. **Extensible**: Modular architecture with clear domain boundaries; easy to add new services
4. **Transparent**: Detailed error codes and audit trails for all security-related actions

### Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript with strict mode
- **HTTP Framework**: Fastify for high performance and plugin-based architecture
- **Validation**: Zod for runtime request validation
- **Package Management**: npm workspaces for monorepo structure
- **Future**: MongoDB/PostgreSQL for persistence, Redis for caching, JWT for token management

---

## Monorepo Structure

NEXUS is organized as a **monorepo using npm workspaces**, enabling shared types and utilities while keeping domains isolated.

```
nexus/                          # Root
├── backend/
│   ├── core/                   # @nexus/core (shared package)
│   │   ├── src/
│   │   │   ├── config/         # Configuration loaders
│   │   │   ├── logger/         # Logging utilities
│   │   │   ├── types/          # Shared domain types
│   │   │   │   ├── index.ts    # User, Student, Account, Session, AppError
│   │   │   └── index.ts        # Exports all public APIs
│   │   ├── package.json        # @nexus/core dependencies
│   │   └── tsconfig.json
│   │
│   ├── api-gateway/            # @nexus/api-gateway (HTTP service)
│   │   ├── src/
│   │   │   ├── app.ts          # Fastify app factory
│   │   │   ├── server.ts       # Startup and listening
│   │   │   ├── plugins/        # Fastify plugins
│   │   │   │   └── auth.ts     # Auth plugin: service + routes
│   │   │   ├── routes/         # Route handlers (organized by domain)
│   │   │   │   ├── auth.ts     # Auth endpoints
│   │   │   │   ├── health.ts   # Health check
│   │   │   │   ├── students.ts # Student profile endpoints
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── access.ts
│   │   │   │   ├── presence.ts
│   │   │   │   └── incidents.ts
│   │   │   ├── services/       # Business logic layer
│   │   │   │   └── auth-service.ts
│   │   │   ├── stores/         # Data access layer (stores)
│   │   │   │   └── mock-auth-store.ts
│   │   │   ├── schemas/        # Zod request/response schemas
│   │   │   │   └── auth.ts     # Auth request/response shapes
│   │   │   ├── types/          # Local type definitions
│   │   │   │   └── fastify.d.ts # Fastify augmentation
│   │   │   └── ...
│   │   ├── package.json        # @nexus/api-gateway dependencies
│   │   └── tsconfig.json
│   │
│   ├── services/               # Future: domain-specific microservices
│   │   ├── attendance-service/
│   │   ├── access-service/
│   │   ├── presence-service/
│   │   ├── incident-service/
│   │   └── ...
│   │
│   ├── ingestion/              # Future: event intake pipeline
│   ├── realtime/               # Future: WebSocket and real-time push
│   ├── ml-services/            # Future: scoring and anomaly detection
│   └── ...
│
├── frontend/
│   ├── mobile-app/
│   ├── web-dashboard/
│   └── shared/
│
├── package.json                # Workspace root
├── tsconfig.base.json          # Shared TS config
└── README.md
```

### Package Responsibilities

#### `@nexus/core` – Shared Foundation

Exports:
- **Domain Types**: `User`, `Student`, `StudentAccount`, `Session`, `AccountStatus`
- **Error Handling**: `AppError` class for structured error responses
- **Config & Logger**: Configuration loaders and logging utilities
- **Type Safety**: All services depend on these shared types

**Why separate?**
- Central place for types that all services use
- Prevents circular dependencies
- Single source of truth for domain contracts
- Testable in isolation

#### `@nexus/api-gateway` – HTTP Service

**Purpose**: HTTP server exposing REST endpoints for mobile clients and web dashboards.

**Key characteristics**:
- Depends on `@nexus/core` for types and utilities
- Single entry point on `:3000` (configurable)
- Currently features the **Auth vertical slice** (fully implemented)
- Placeholder route files for future domains (Students, Attendance, Access, Presence, Incidents)
- In-memory stores for development (will migrate to real DB)
- Structured error responses with error codes

---

## Backend Architecture

### Layered Request-Response Flow

```
Fastify Route Handler
    ↓ (Zod validation)
Service Layer (AuthService)
    ↓ (business logic)
Store Layer (MockAuthStore)
    ↓ (data operations)
Response JSON (or AppError)
```

### Key Architectural Patterns

#### 1. Plugin-Based Service Registration

Fastify plugins provide a clean way to register services and routes:

```typescript
// authPlugin
const authPlugin: FastifyPluginAsync = async (fastify) => {
  const store = new MockAuthStore();
  const authService = new AuthService(store);
  
  // Decorate fastify instance with the service
  fastify.decorate('authService', authService);
  
  // Register routes
  fastify.post('/auth/login', async (request, reply) => {
    const result = fastify.authService.login(...);
    return reply.send(result);
  });
};

// app.ts
await app.register(authPlugin);
```

This pattern:
- Isolates service initialization
- Makes services available to all routes via `fastify.authService`
- Allows late binding and composition
- Supports testing via dependency injection

#### 2. Service → Store → Route Layering

Each vertical slice follows a clear separation:

- **Route Handler**: Accepts HTTP request, validates with Zod, delegates to service
- **Service**: Contains business logic, calls store, returns result or throws `AppError`
- **Store**: Manages data storage/retrieval (currently in-memory, will be DB queries)

Example:

```typescript
// Route: Validate and delegate
fastify.post('/auth/login', async (request, reply) => {
  const body = LoginRequestSchema.parse(request.body); // Zod validates
  const authResponse = fastify.authService.login(
    body.identifier,
    body.password,
    body.deviceId
  );
  return reply.send(authResponse);
});

// Service: Business logic
login(identifier: string, password: string, deviceId: string): AuthResponse {
  const account = this.store.getAccountByEmailOrRollNumber(identifier);
  if (!account) throw new AppError('INVALID_CREDENTIALS', 401, '...');
  if (!this.store.validatePassword(account, password)) throw new AppError(...);
  if (account.status === 'pending') throw new AppError('ACCOUNT_NOT_ACTIVATED', 403, '...');
  if (this.store.hasActiveDeviceSession(account.studentId)) 
    throw new AppError('DEVICE_ALREADY_BOUND', 409, '...');
  
  const session = this.store.createSession(account.studentId, deviceId);
  return { accessToken: session.accessToken, ... };
}

// Store: Data operations
createSession(studentId: string, deviceId: string): Session {
  const session: Session = {
    id: randomUUID(),
    studentId,
    deviceId,
    accessToken: randomUUID(),
    refreshToken: randomUUID(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
  };
  this.sessions.set(session.accessToken, session);
  this.studentDeviceSessions.set(studentId, session);
  return session;
}
```

#### 3. Structured Error Handling with AppError

All domain-level errors are instances of `AppError`, which ensures:
- Consistent error response format
- Semantic error codes (e.g., `INVALID_CREDENTIALS`, `DEVICE_ALREADY_BOUND`)
- Proper HTTP status mappings
- Clear error messages

```typescript
// @nexus/core/types/index.ts
export class AppError extends Error {
  constructor(
    public code: string,           // Semantic error identifier
    public statusCode: number,     // HTTP status
    message: string
  ) { ... }
}

// Usage:
throw new AppError(
  'INVALID_CREDENTIALS',
  401,
  'Invalid roll number/email or password'
);

// Response format:
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid roll number/email or password"
  }
}
```

#### 4. Runtime Validation with Zod

All request bodies are validated using Zod schemas before reaching service logic:

```typescript
// schemas/auth.ts
export const LoginRequestSchema = z.object({
  identifier: z.string().min(1, 'Identifier required'),
  password: z.string().min(1, 'Password required'),
  deviceId: z.string().min(1, 'Device ID required'),
});

// Route handler
try {
  const body = LoginRequestSchema.parse(request.body);
  // If we reach here, body is 100% valid
  const result = fastify.authService.login(...);
} catch (error) {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map(i => i.message).join(', '),
      },
    });
  }
}
```

Benefits:
- **Type safety**: TypeScript infers the shape of valid requests
- **Single source of truth**: Schema doubles as documentation
- **Early failure**: Invalid requests rejected before business logic runs
- **Detailed feedback**: Users get specific field-level errors

---

## Auth Vertical Slice (Detailed)

The **Auth vertical slice** is the first fully implemented feature in NEXUS. It provides:
- Student account activation
- Login with roll number or email
- One-device binding policy
- Device switching
- Session management

This section documents the domain rules, data structures, and API contracts.

### Domain Rules

#### 1. Admin-Provisioned Accounts Only

Students do not self-register. Instead:

- Campus administrators pre-create student accounts in the system
- Each account has a unique `studentId` (e.g., `std_001`) and `rollNumber` (e.g., `CS21001`)
- Accounts start in **`pending`** status with a unique **`activationToken`**
- The activation token is sent to the student out-of-band (email)

```
Admin creates: { studentId: "std_001", rollNumber: "CS21001", 
                  email: "cs21001@campus.edu", 
                  activationToken: "abc123def456" }

Student receives email with token, then calls /auth/activate
```

#### 2. Activation via Token

To activate an account:

- Student calls `POST /auth/activate` with `activationToken` and desired `password`
- If token is valid and account is `pending`, status changes to `active` and password is set
- Once activated, the same token cannot be reused
- Student can then log in

```
Flow:
pending (activation_token_001) --[activate]--> active (password set)
 ^
 |--- cannot reuse token
```

#### 3. Login: Roll Number or Campus Email

Students can authenticate using **either**:

- **Roll number** + password (e.g., `CS21001`)
- **Campus email** + password (e.g., `cs21001@campus.edu`)

Both go to the same endpoint and return the same auth response.

```typescript
// ServiceLogic
const account = this.store.getAccountByEmailOrRollNumber(identifier);
// Internally tries email first, then roll number
```

#### 4. One Active Device Per Student

A student can only have **one active device session** at a time:

- If student logs in on Device A and receives a session token
- If student then tries to log in on Device B with the same credentials → **DEVICE_ALREADY_BOUND** error (409)
- To switch devices, student must either:
  - **Logout** from Device A first, OR
  - **Device switch** endpoint to atomically move to Device B

Rationale:
- Prevents credential sharing
- Tracks which physical device a student is using
- Simplifies access validation (one device = known location, known capabilities)

#### 5. Device Switching

Device switching allows moving an active session from one device to another **atomically**:

```
Device A has active session
+ Device switch request (oldDeviceId: A, newDeviceId: B)
= New session on Device B, old session on A invalidated
```

Validation:
- `studentId`, `oldDeviceId`, and the old device must have an active session
- `oldDeviceId` must match what the server has
- If mismatch → **DEVICE_SWITCH_MISMATCH** error (409)

### Data Structures

#### StudentAccount

Represents a student's account in the system:

```typescript
export interface StudentAccount {
  studentId: string;        // Unique ID assigned by admin (e.g., "std_001")
  rollNumber: string;       // Campus roll number (e.g., "CS21001")
  email: string;            // Campus email (e.g., "cs21001@campus.edu")
  password: string;         // Hashed password (currently plaintext; will hash later)
  status: AccountStatus;    // "pending" | "active"
  activationToken?: string; // Token if pending, cleared on activation
}
```

#### Session

Represents an active login session:

```typescript
export interface Session {
  id: string;             // Unique session ID (UUID)
  studentId: string;      // Link to account
  deviceId: string;       // Which device (e.g., "ios-iphone-15")
  accessToken: string;    // Bearer token for API calls (UUID v4, currently)
  refreshToken: string;   // For token refresh (future)
  createdAt: Date;        // Session creation timestamp
  expiresAt: Date;        // Session expiration (15 min by default)
}
```

#### AuthResponse

Returned on successful login or device switch:

```typescript
export interface AuthResponse {
  accessToken: string;    // Bearer token
  refreshToken: string;   // Refresh token (for future use)
  expiresIn: number;      // Seconds until expiration (900 = 15 min)
  tokenType: string;      // Always "Bearer"
  user: {
    id: string;           // studentId
    rollNumber: string;
    email: string;
    role: string;         // Always "student" for now
  };
}
```

### Implementation Details

#### MockAuthStore

The `MockAuthStore` is an in-memory implementation for development. It manages:

**Data**:
- `accounts`: Map of `studentId` → `StudentAccount`
- `sessions`: Map of `accessToken` → `Session`
- `studentDeviceSessions`: Map of `studentId` → currently active `Session`

**Seeded accounts** (at startup):

```typescript
{
  studentId: "std_001",
  rollNumber: "CS21001",
  email: "cs21001@campus.edu",
  password: "pass123",
  status: "pending",
  activationToken: "activation_token_001"
}

{
  studentId: "std_002",
  rollNumber: "CS21002",
  email: "cs21002@campus.edu",
  password: "pass456",
  status: "active"
}
```

**Key methods**:

```typescript
getAccountByEmailOrRollNumber(identifier: string): StudentAccount | undefined
  // Returns account where email OR rollNumber matches

validatePassword(account: StudentAccount, password: string): boolean
  // For now, simple string comparison; will hash later

hasActiveDeviceSession(studentId: string): boolean
  // True if studentId has a current session

createSession(studentId: string, deviceId: string): Session
  // Creates new session, invalidates any prior session for that student

activateAccountByToken(token: string, password: string): StudentAccount
  // Finds account with matching token, sets password, marks active

invalidateSession(accessToken: string): void
  // Removes session from the store

deviceSwitch(studentId: string, oldDeviceId: string, newDeviceId: string): Session
  // Atomically moves session to new device
```

#### AuthService

The `AuthService` encapsulates all auth business logic. It depends on `MockAuthStore` and throws `AppError` for failures.

**Key methods**:

```typescript
activate(activationToken: string, password: string): StudentAccount
  // 1. Find account by token
  // 2. Error if not pending
  // 3. Error if token invalid/used
  // 4. Set password, mark active, clear token
  // Returns updated account

login(identifier: string, password: string, deviceId: string): AuthResponse
  // 1. Find account by email or roll number
  // 2. Error if not found or password invalid
  // 3. Error if account not yet activated
  // 4. Error if device already bound to another session
  // 5. Create new session
  // Returns AuthResponse with tokens and user info

logout(studentId: string, deviceId: string): void
  // 1. Find account (error if not found)
  // 2. Find session (error if no active session)
  // 3. Validate device matches
  // 4. Invalidate the session

deviceSwitch(studentId: string, oldDeviceId: string, newDeviceId: string): AuthResponse
  // 1. Find account (error if not found)
  // 2. Find active session (error if none)
  // 3. Validate oldDeviceId matches session
  // 4. Invalidate old session
  // 5. Create new session on newDeviceId
  // Returns new AuthResponse
```

**Error codes** (all instances of `AppError`):

```
INVALID_CREDENTIALS (401)           -> email/roll or password incorrect
ACCOUNT_NOT_ACTIVATED (403)         -> account status is "pending"
ACCOUNT_NOT_FOUND (404)             -> specified account doesn't exist
SESSION_NOT_FOUND (404)             -> no active session for device/student
DEVICE_ALREADY_BOUND (409)          -> another active session exists
DEVICE_SWITCH_MISMATCH (409)        -> oldDeviceId doesn't match active session
INVALID_ACTIVATION_TOKEN (400/404)  -> token not found or already used
ALREADY_ACTIVATED (409)             -> account already active, can't activate again
```

#### Auth Plugin (Registration)

The `auth.ts` plugin in `plugins/` does three things:

1. **Initialize stores and services**:
   ```typescript
   const store = new MockAuthStore();
   const authService = new AuthService(store);
   ```

2. **Decorate fastify instance**:
   ```typescript
   fastify.decorate('authService', authService);
   ```
   Now all routes can call `fastify.authService.login(...)`, etc.

3. **Register routes**:
   Routes use Zod to validate the request body, call the service, and send a response or error.

### API Endpoints

#### POST /auth/activate

**Purpose**: Activate a pending account by providing the activation token and password.

**Request Body**:

```typescript
{
  "activationToken": string;  // The token from the activation email
  "password": string;         // New password (will be used for login)
}
```

**Request Example**:

```http
POST http://localhost:3000/auth/activate
Content-Type: application/json

{
  "activationToken": "activation_token_001",
  "password": "newpass123"
}
```

**Response (200 OK)**:

```json
{
  "message": "Account activated successfully",
  "account": {
    "studentId": "std_001",
    "email": "cs21001@campus.edu",
    "status": "active"
  }
}
```

**Error (400 – Invalid Token)**:

```json
{
  "error": {
    "code": "INVALID_ACTIVATION_TOKEN",
    "message": "Activation token not found or already used"
  }
}
```

**Error (409 – Already Activated)**:

```json
{
  "error": {
    "code": "ALREADY_ACTIVATED",
    "message": "Account is already activated"
  }
}
```

---

#### POST /auth/login

**Purpose**: Authenticate a student using roll number or email, and bind to a device.

**Request Body**:

```typescript
{
  "identifier": string;  // Roll number or campus email
  "password": string;
  "deviceId": string;    // Unique device identifier (e.g., "ios-iphone-15", "android-pixel-8")
}
```

**Request Example**:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "identifier": "CS21002",
  "password": "pass456",
  "deviceId": "ios-iphone-15"
}
```

**Response (200 OK)**:

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

**Error (401 – Invalid Credentials)**:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid roll number/email or password"
  }
}
```

**Error (403 – Account Not Activated)**:

```json
{
  "error": {
    "code": "ACCOUNT_NOT_ACTIVATED",
    "message": "Account must be activated before login"
  }
}
```

**Error (409 – Device Already Bound)**:

Triggered if another device has an active session for this account.

```json
{
  "error": {
    "code": "DEVICE_ALREADY_BOUND",
    "message": "Another device is already bound to this account"
  }
}
```

---

#### POST /auth/logout

**Purpose**: Invalidate the active session for a device.

**Request Body**:

```typescript
{
  "studentId": string;   // The student account ID
  "deviceId": string;    // The device to logout from
}
```

**Request Example**:

```http
POST http://localhost:3000/auth/logout
Content-Type: application/json

{
  "studentId": "std_002",
  "deviceId": "ios-iphone-15"
}
```

**Response (200 OK)**:

```json
{
  "message": "Logged out successfully"
}
```

**Error (404 – Session Not Found)**:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "No active session for this device"
  }
}
```

---

#### POST /auth/device/switch

**Purpose**: Move an active session from one device to another (atomic operation).

**Request Body**:

```typescript
{
  "studentId": string;   // The student account ID
  "oldDeviceId": string; // Current device
  "newDeviceId": string; // Target device
}
```

**Request Example**:

```http
POST http://localhost:3000/auth/device/switch
Content-Type: application/json

{
  "studentId": "std_002",
  "oldDeviceId": "ios-iphone-15",
  "newDeviceId": "android-pixel-8"
}
```

**Response (200 OK)**:

Returns a new `AuthResponse` with new tokens for the new device:

```json
{
  "accessToken": "new-token-uuid",
  "refreshToken": "new-refresh-token-uuid",
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

**Error (409 – Device Mismatch)**:

```json
{
  "error": {
    "code": "DEVICE_SWITCH_MISMATCH",
    "message": "Old device ID does not match active session"
  }
}
```

---

## Running the Project

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (supports workspaces)
- **TypeScript**: v5.0.0 (installed as dev dependency)

### Installation and Build

```bash
# Install dependencies for all workspaces
npm install

# Build all packages (core + gateway)
npm run build
```

### Development Mode

```bash
# Start the API gateway in watch mode
npm run dev
```

When you run `npm run dev`, the following happens:

1. **TypeScript compilation**: `ts-node` compiles `backend/api-gateway/src/server.ts` on the fly
2. **Server starts**: Listens on `http://localhost:3000`
3. **Live reload**: `nodemon` watches for file changes and restarts the server
4. **Logs**: Pino logger outputs to stdout with Fastify request logs

You should see output like:

```
> @nexus/api-gateway dev

[00:00:00.000] INFO: Fastify server listening on port 3000
[00:00:00.001] DEBUG: AuthRoute: Plugin registered
```

### Production Mode

```bash
# Build for production
npm run build

# Start the production server
npm start
```

This runs the compiled JavaScript directly without TypeScript overhead.

### Configuration

Currently, configuration is minimal. The server hardcodes:
- **Port**: `3000`
- **Host**: `localhost`

Future: Move to environment variables (`.env` file or process.env).

---

## Testing the API with test.http

### VS Code REST Client

The repository includes `test.http` in the root directory. This file uses the **REST Client** VS Code extension to make HTTP requests directly from the editor.

**Installation**:

1. Install the **REST Client** extension (by Huachao Zhong)
2. Open `test.http` in VS Code
3. You'll see a "Send Request" link above each request
4. Click it, and the response appears in a sidebar panel

### Test Scenarios Covered

The `test.http` file includes:

1. **Health Check**
   - `GET /health`
   - Verifies the server is running

2. **Login with Active Account**
   - Login on Device A with the seeded active account (`std_002` / `CS21002`)
   - Expect: `200 OK` with auth tokens

3. **Device Binding Conflict**
   - Try to login the same account on Device B (should fail with `DEVICE_ALREADY_BOUND`)
   - Demonstrates one-device policy

4. **Logout**
   - Logout from Device A
   - Expect: `200 OK`
   - Frees the slot for another device

5. **Login After Logout**
   - Login on Device B after Device A was logged out
   - Expect: `200 OK` with new tokens (one device can now bind)

6. **Device Switch**
   - Move session from Device B to Device A (atomically)
   - Expect: `200 OK` with new tokens on Device A

7. **Account Activation**
   - Activate a pending account using `activation_token_001`
   - Expect: `200 OK`, account is now active

8. **Reactivation Failure**
   - Try to activate again with the same token
   - Expect: `409 CONFLICT` with `ALREADY_ACTIVATED`

9. **Login with Activated Account**
   - Login with the freshly activated account
   - Use newly set password
   - Expect: `200 OK` with tokens

10. **Activation Before Login**
    - Try to login a pending account before activation
    - Expect: `403 FORBIDDEN` with `ACCOUNT_NOT_ACTIVATED`

11. **Invalid Credentials**
    - Login with wrong password
    - Expect: `401 UNAUTHORIZED` with `INVALID_CREDENTIALS`

12. **Device Switch Mismatch**
    - Try to switch from a nonexistent old device
    - Expect: `409 CONFLICT` with `DEVICE_SWITCH_MISMATCH`

### Running Tests

```bash
# 1. Start the dev server
npm run dev

# 2. Open test.http in VS Code
# 3. Click "Send Request" on any request
# 4. Check the response in the sidebar
```

All requests use variables defined at the top of `test.http` (e.g., `{{baseUrl}}`, `{{activeRoll}}`), making it easy to modify test data.

---

## Development Workflow

### Adding a New Vertical Slice (Domain)

A "vertical slice" is a complete feature from HTTP route → service → store. Here's how to add one:

#### Example: Student Profile Vertical Slice

**Step 1: Define Types** (`backend/core/src/types/index.ts`)

```typescript
export interface StudentProfile {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  program: string; // e.g., "B.Tech Computer Science"
  batch: number;   // e.g., 2021
}
```

**Step 2: Create a Store** (`backend/api-gateway/src/stores/student-store.ts`)

```typescript
import { StudentProfile } from '@nexus/core';

export class StudentStore {
  private profiles = new Map<string, StudentProfile>();

  constructor() {
    // Seed with test data
    this.profiles.set('std_001', {
      id: 'std_001',
      rollNumber: 'CS21001',
      name: 'Alice Johnson',
      email: 'cs21001@campus.edu',
      program: 'B.Tech Computer Science',
      batch: 2021,
    });
  }

  getById(studentId: string): StudentProfile | undefined {
    return this.profiles.get(studentId);
  }

  getByRollNumber(rollNumber: string): StudentProfile | undefined {
    return Array.from(this.profiles.values()).find(p => p.rollNumber === rollNumber);
  }
}
```

**Step 3: Create a Service** (`backend/api-gateway/src/services/student-service.ts`)

```typescript
import { StudentProfile, AppError } from '@nexus/core';
import { StudentStore } from '../stores/student-store';

export class StudentService {
  constructor(private store: StudentStore) {}

  getProfile(studentId: string): StudentProfile {
    const profile = this.store.getById(studentId);
    if (!profile) {
      throw new AppError('STUDENT_NOT_FOUND', 404, 'Student profile not found');
    }
    return profile;
  }

  getByRollNumber(rollNumber: string): StudentProfile {
    const profile = this.store.getByRollNumber(rollNumber);
    if (!profile) {
      throw new AppError('STUDENT_NOT_FOUND', 404, 'No student with that roll number');
    }
    return profile;
  }
}
```

**Step 4: Create Zod Schemas** (`backend/api-gateway/src/schemas/student.ts`)

```typescript
import { z } from 'zod';

export const GetStudentRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID required'),
});

export const GetStudentByRollRequestSchema = z.object({
  rollNumber: z.string().min(1, 'Roll number required'),
});
```

**Step 5: Create a Plugin** (`backend/api-gateway/src/plugins/student.ts`)

```typescript
import { FastifyPluginAsync } from 'fastify';
import { StudentService } from '../services/student-service';
import { StudentStore } from '../stores/student-store';

const studentPlugin: FastifyPluginAsync = async (fastify) => {
  const store = new StudentStore();
  const service = new StudentService(store);

  fastify.decorate('studentService', service);

  fastify.get('/students/:studentId', async (request, reply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const profile = fastify.studentService.getProfile(studentId);
      return reply.send(profile);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.get('/students/roll/:rollNumber', async (request, reply) => {
    try {
      const { rollNumber } = request.params as { rollNumber: string };
      const profile = fastify.studentService.getByRollNumber(rollNumber);
      return reply.send(profile);
    } catch (error) {
      return handleError(reply, error);
    }
  });
};

function handleError(reply: FastifyReply, error: unknown): FastifyReply {
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

export default studentPlugin;
```

**Step 6: Register the Plugin** (`backend/api-gateway/src/app.ts`)

```typescript
import studentPlugin from './plugins/student';

export async function createApp() {
  const app = fastify({ logger: true });

  await app.register(authPlugin);
  await app.register(studentPlugin); // Add this

  // ... other registrations
  return app;
}
```

**Step 7: Add Tests** (`test.http`)

```http
### Get student profile by ID
GET http://localhost:3000/students/std_001

### Get student by roll number
GET http://localhost:3000/students/roll/CS21001
```

**Step 8: Augment Fastify Type** (`backend/api-gateway/src/types/fastify.d.ts`)

```typescript
import { StudentService } from '../services/student-service';

declare module 'fastify' {
  interface FastifyInstance {
    studentService: StudentService;
  }
}
```

### Coding Style Expectations

#### TypeScript Strictness

- Use `strict: true` in `tsconfig.json`
- No implicit `any` types
- Explicit return types on all functions

```typescript
// ✅ Good
function greet(name: string): string {
  return `Hello, ${name}`;
}

// ❌ Bad
function greet(name) {
  return `Hello, ${name}`;
}
```

#### Zod for Validation

- Always validate request bodies with Zod
- Reuse schemas across handlers
- Infer TypeScript types from schemas

```typescript
// schemas/example.ts
export const RequestSchema = z.object({
  username: z.string().min(1),
  age: z.number().positive(),
});

export type Request = z.infer<typeof RequestSchema>;

// route handler
const body = RequestSchema.parse(request.body);
// body is now typed as Request automatically
```

#### AppError for Business Errors

- Use `AppError` for all expected failures (validation, not found, conflict, etc.)
- Include semantic error codes and HTTP status
- Don't let unexpected errors bubble up; catch and wrap in AppError or return 500

```typescript
// ✅ Good
if (!user) {
  throw new AppError('USER_NOT_FOUND', 404, 'User does not exist');
}

// ❌ Bad
throw new Error('User not found');
return reply.code(400).send({ message: 'error' });
```

#### Thin Route Handlers

- Routes should validate and delegate; keep logic in services
- One route → one service call (mostly)

```typescript
// ✅ Good
fastify.post('/auth/login', async (request, reply) => {
  const body = LoginSchema.parse(request.body);
  const response = fastify.authService.login(...);
  return reply.send(response);
});

// ❌ Bad (logic in route)
fastify.post('/auth/login', async (request, reply) => {
  const account = store.getByEmail(request.body.email);
  if (!account) { ... }
  if (account.password !== sha256(request.body.password)) { ... }
  // ^ Should be in service
});
```

---

## Roadmap / Next Steps

### Phase 1: Current (Auth Vertical Slice Complete)

- ✅ Admin-provisioned accounts
- ✅ Account activation via token
- ✅ Login (roll number or email)
- ✅ One-device binding
- ✅ Device switching
- ✅ Logout

**Next Priority**: User information and profile endpoints.

### Phase 2: Students & Profile

- Student profile data (`/students/:studentId`)
- Lookup by roll number
- Update profile (admin only)
- Link to auth via session tokens

### Phase 3: Schedule & Attendance

- Class schedules per student
- Attendance marking with geolocation/BLE validation
- Grace windows (configurable per campus)
- Attendance records and history

### Phase 4: Presence & Location

- Location ingestion (GPS, BLE, relay batches from DOLN)
- Last-known location per student
- Movement trail reconstruction
- Offline relay storage (DOLN integration)

### Phase 5: Access Verification

- Campus entry points (gates, parking)
- Access control rules
- QR/NFC validation
- Real-time access logs

### Phase 6: Reliability & Risk Scoring

- Behavioral signals aggregation
- Reliability score computation
- Risk categories (low, medium, high)
- Anomaly detection

### Phase 7: Security & Incidents

- Alert creation and filtering
- Incident management (create, assign, escalate, resolve)
- Audit trail for all actions
- Dashboard views for security teams

### Infrastructure & DevOps

- **Persistence**: Replace in-memory stores with MongoDB or PostgreSQL
- **Auth Tokens**: Migrate from UUID to JWT (signed, verifiable)
- **Caching**: Redis for session storage and hot data
- **Real-time**: WebSocket support (Fastify ws plugin)
- **Offline Sync**: DOLN protocol implementation for mobile clients
- **Logging**: Centralized logging (e.g., ELK stack)
- **Monitoring**: Metrics and alerting
- **Deployment**: Docker containerization, CI/CD pipeline

---

## Summary

NEXUS is a modular, extensible backend for campus security and attendance. The **Auth vertical slice** demonstrates the complete architecture:

- **Monorepo organization** with shared types in `@nexus/core`
- **Plugin-based service registration** in Fastify
- **Layered architecture** (route → service → store)
- **Structured error handling** with `AppError`
- **Runtime validation** with Zod
- **Clear domain rules** (activation, one-device binding, device switching)

The development workflow is straightforward: define types, create a store, write a service, add routes, and test with `test.http`. All new features follow the same pattern, ensuring consistency and maintainability.

For questions or contributions, refer to this README and the source code. Future PRs should extend the pattern demonstrated in the auth slice to new domains.

### Core Ideas

- Every student has a **personal timetable** (classes with locations + times), plus campus events (festivals, talks, hackathons, etc.).
- Student accounts are **admin-provisioned** by campus staff, using roll number and official campus email (e.g., `.edu` or campus-issued domain).
- Students activate their account via in-email activation link and set their password; public self-signup is not supported.
- During a scheduled class, if no special event is defined, the student is expected to be inside that **classroom** (with a time buffer).
- **Access verification** (campus entry, parking) is tied to the student’s **ID / roll number** and a **single active device**.
- Login supports roll number + password (primary) and official campus email + password (secondary identifier).
- Location is inferred from:
  - GPS → which building / zone they are in
  - BLE mesh (phones) → local proximity, especially for future DOLN features
  - Fixed BLE beacons are the primary long-term indoor verification mechanism; phone-to-phone BLE mesh is an optional fallback/resilience layer.
- NEXUS maintains a **reliability score** per student based on behavior:
  - Fake attendance attempts
  - Frequent loitering during class hours
  - Excessive device switching
  - Turning off connectivity / BLE in suspicious patterns
  - Chronic skipping of scheduled classes

### Backend Stack Assumptions

- Node.js runtime
- TypeScript for type safety
- Fastify for HTTP/WebSocket framework
- MongoDB for document storage
- Redis for caching and session management

### v1 Limitations

- No installed BLE beacons; v1 relies on GPS for building/zone verification and phone-to-phone BLE mesh as available.
- Loitering detection is soft/low-confidence inference based on schedule mismatch, coarse zone presence, and behavior signals; no strong passive/background room-level tracking.
- Monitors students only; no staff/faculty schedule modeling.
- Campus-level policies (e.g., grace windows) are configurable for future productization.

---

## Bounded Contexts (Domain Modules)

NEXUS is designed as a **modular monolith** with domain-centric services under `backend/services`.

Each context owns its data and rules; other modules interact through APIs or events.

### 1. Identity & Session Management

- **Purpose:** Who the student is, which device they use, how they authenticate.
- **Owns:**
  - Student profile (roll no, name, program, batch)
  - Account credentials
  - Device registrations and bindings
  - Session tokens / refresh tokens
- **Key responsibilities:**
  - One active device session per student
  - Device binding & revocation
  - Authentication / authorization integration

### 2. Campus Operations

- **Purpose:** The physical and logical model of the campus.
- **Owns:**
  - Campuses
  - Zones (academic, residential, open, etc.)
  - Buildings (academic blocks, hostels, admin buildings)
  - Classrooms
  - Gates / entry points
  - Parking areas
  - Sports complex, lawns/open areas
  - Cafeterias / food outlets
- **Key responsibilities:**
  - Geofence definitions per zone/building
  - Room metadata (capacity, building mapping)
  - Policy metadata per zone (e.g., controlled vs open)

### 3. Schedule & Attendance

- **Purpose:** Student timetables, campus events, and attendance records.
- **Owns:**
  - Class schedules per student
  - Class sessions (course + room + timeslot)
  - Events (fests, talks, hackathons, etc.)
  - Attendance records
- **Key responsibilities:**
  - Expected location per student at any time
  - Grace windows around classes (default: 5 min before and 5 min after; campus-configurable)
  - Validation rules for marking attendance
  - Integration with location and access signals

### 4. Presence & Location

- **Purpose:** Where students/devices have been and where they are now.
- **Owns:**
  - Raw location events (GPS pings)
  - BLE sightings (phone-to-phone)
  - Offline relay batches (DOLN uploads)
  - Last-known presence state
  - Movement trails (reconstructed)
- **Key responsibilities:**
  - Ingesting and aggregating location signals
  - Reconstructing movement trails from events
  - Maintaining last-known location per student
  - Providing “where is this student now?” answers

### 5. Access Verification

- **Purpose:** Verifying entry to campus, parking, and other access points.
- **Owns:**
  - Access points (gates, parking entries, other checkpoints)
  - Access events (attempts and successes/failures)
- **Key responsibilities:**
  - Validating campus entry (QR / NFC / digital credential)
  - Validating parking access
  - Linking access events to student + device + time + location

### 6. Reliability & Risk

- **Purpose:** Behavioral reliability score and risk signals for students.
- **Owns:**
  - Reliability score per student
  - Risk signals and rule evaluations
- **Key responsibilities:**
  - Aggregating signals:
    - Fake attendance attempts
    - Loitering during class time
    - Frequent device switching
    - Connectivity/BLE tampering around key events
    - Skipping classes persistently
  - Producing a reliability score and simple risk categories
  - Feeding scores into alerting and hotspot detection

### 7. Security Incidents & Alerts

- **Purpose:** Turning signals into alerts and managed incidents.
- **Owns:**
  - Alerts
  - Incidents/cases
  - Incident status and assignments
  - Action log (who did what, when)
- **Key responsibilities:**
  - Creating alerts from anomalies and rules
  - Combining multiple related alerts into one incident
  - Providing workflows: acknowledge → assign → escalate → resolve
  - Keeping an audit trail for reviews

---

## Core Domain Events (First Pass)

Events are written in **past tense** and are emitted by the domain.

- `student_registered`
- `device_registered`
- `device_bound_to_student`
- `device_session_started`
- `device_session_revoked`
- `campus_zone_defined`
- `class_session_scheduled`
- `campus_event_scheduled`
- `gps_location_recorded`
- `ble_sighting_recorded`
- `relay_batch_uploaded`
- `presence_state_updated`
- `movement_trail_reconstructed`
- `attendance_mark_attempted`
- `attendance_marked`
- `attendance_mark_rejected`
- `access_attempted`
- `access_granted`
- `access_denied`
- `risk_signal_recorded`
- `reliability_score_updated`
- `alert_raised`
- `alert_acknowledged`
- `incident_created`
- `incident_assigned`
- `incident_escalated`
- `incident_resolved`

This list will evolve, but it anchors the event-driven parts of the system.

---

## Core User Flows

### 1. Student – Campus Entry

1. Student opens NEXUS mobile app (single active device).
2. Student authenticates.
3. At a campus gate/entry, student:
   - scans a QR code, or
   - taps NFC / mobile credential.
4. Access Verification validates:
   - student identity & active device
   - campus-level access rules
5. On success:
   - Campus entry event recorded (`access_granted`)
   - Presence updated (student “on campus”)
6. Student may then proceed to classes / parking.

### 2. Student – Class Attendance

1. Student has a class scheduled at time T in room R.
2. There is a grace window: `[T - 5 min, T + 5 min]` for entry and `[T_end - 5 min, T_end + 5 min]` for exit (configurable per campus).
3. Within that window, the app:
   - Confirms GPS location in the correct building
   - Uses BLE mesh (other phones / future beacons) to estimate proximity to room zone
4. Student taps “Mark Attendance”.
5. Schedule & Attendance:
   - Confirms schedule + no conflicting event
   - Confirms valid location signals
   - Records attendance (`attendance_marked`) or rejects (`attendance_mark_rejected`).
6. Reliability & Risk records signals for unusual patterns.

### 3. Student – Parking Access

1. Student drives/walks to a parking entry.
2. Uses NEXUS mobile app to scan/verify access.
3. Access Verification:
   - Checks parking permissions
   - Validates student + device
4. Records `access_granted` or `access_denied`.
5. Presence updated with parking zone location.

### 4. Security – Student Lookup

1. Security officer opens web dashboard.
2. Searches for a student by roll number.
3. Dashboard shows:
   - Current/last-known location
   - Today’s schedule and attendance status
   - Recent access events (entry/parking)
   - Reliability score and recent risk signals
   - Open incidents (if any) for that student.

### 5. Security – Hotspot and Loitering Monitoring

1. Presence & Location continuously updates location and trails.
2. Reliability & Risk runs rules:
   - Students in lawns/sports/cafeteria during their class window with no valid event.
   - Students repeatedly staying in open zones instead of scheduled classes.
3. Security dashboard receives:
   - Hotspot alerts for zones with intensifying suspicious activity
   - Lists of students contributing to those hotspots.
4. Security can inspect, create an incident, or ignore/close alerts.

### 6. Security – Incident Workflow

1. An alert or manual action creates an incident.
2. Incident has:
   - Linked student(s)
   - Linked zones/locations
   - Timeline of signals and actions
3. Security can:
   - Assign to an officer
   - Add notes
   - Escalate
   - Resolve
4. All actions are logged in the audit trail.

---

## API Contract

- See `backend/api-gateway/API-CONTRACTS.md` for finalized REST API endpoints, auth model, and token/session rules.
- Public self-signup is disallowed; only admin-provisioned student accounts are permitted.

## Architectural Ownership Rules

- Each bounded context owns its data; other modules **do not** access its DB tables/collections directly.
- `backend/services` contains the domain services for each context.
- `backend/ingestion` handles **raw event intake** (GPS, BLE, relay batches).
- `backend/realtime` pushes state and alerts to clients.
- `backend/ml-services` may consume events and produce scores, but **cannot own canonical domain state**.
- `backend/core` is for shared contracts, config, and cross-cutting utilities – **no business logic**.
- `backend/api-gateway` is the single HTTP/WebSocket entrypoint for mobile and web clients.
