# API Contracts

## Overview

NEXUS external API is a REST-first contract served by `backend/api-gateway`. It exposes secure endpoints for mobile and web clients to interact with bounded contexts in the platform.

Key principles:
- Admin-provisioned student accounts only (no public self-signup)
- Single active device session per student
- Device ID required for all auth operations (identifies client device)
- Explicit auth flows and token lifecycle management
- Mock data for dashboard flows (backend integration in progress)

**Status**: Core auth flows implemented ✅. Attendance, access, incidents, presence endpoints stubbed (placeholders only).

## Authentication Model

- Students and admins authenticate using credentials provisioned by the campus admin.
- Public signup is NOT supported.
- Primary student login factor: roll number + password.
- Secondary login factor: official campus email (e.g., `.edu`, campus-issued domain) + password.
- Admin accounts are created by system initialization or campus administration workflows.
- Account activation is via email invite with one-time activation link.

### Token model

- `accessToken` (UUID): short-lived token for resource access, included as `Authorization: Bearer <token>`.
  - Current implementation: 15-minute expiration (development only)
  - Future: JWT with RS256 signing and 15-min/7-day refresh lifecycle
- `refreshToken` (UUID): long-lived token used by future `/auth/refresh` endpoint.
  - Not yet implemented
- Tokens not yet persisted for revocation checks (in-memory sessions only)

### One-active-device rule

- Every student can have at most one active mobile device session.
- When a new device logs in, previously active session is revoked.
- `POST /auth/device/switch` triggers replace/revoke flow for a student.

## Role Model

**Current Implementation** (v0.1 - Development):
- `student`: returned by login endpoint for all authenticated users
  - Access to attendance, access, presence endpoints
  - Security and admin roles not yet implemented

**Planned Role Model** (v1.0):
- `student`: access to student dashboard and attendance/entry endpoints
- `security`: access to monitoring, alerts and incident management
- `admin`: access to user provisioning and global configuration

## Implemented Endpoints

### Health Check

- `GET /health` - Health status (always returns 200 OK)

### Auth and Session Management ✅ Complete

- `POST /auth/activate` - Activate account with activation token and set password
  - **Required fields**: `activationToken`, `password`
  - **Returns**: Account details and auth tokens
  - **Errors**: `INVALID_ACTIVATION_TOKEN`, `ALREADY_ACTIVATED`

- `POST /auth/login` - Login with roll number or email + password
  - **Required fields**: `identifier` (roll# or email), `password`, `deviceId`
  - **Returns**: Access/refresh tokens and user object
  - **Enforces**: One active device per student (error if already bound)
  - **Errors**: `INVALID_CREDENTIALS`, `ACCOUNT_NOT_ACTIVATED`, `DEVICE_ALREADY_BOUND`

- `POST /auth/logout` - Revoke current session
  - **Required fields**: `studentId`, `deviceId`
  - **Returns**: Success message
  - **Errors**: `SESSION_NOT_FOUND`, `DEVICE_SWITCH_MISMATCH`

- `POST /auth/device/switch` - Atomically move session to new device
  - **Required fields**: `studentId`, `oldDeviceId`, `newDeviceId`
  - **Returns**: New access/refresh tokens
  - **Behavior**: Invalidates old session, creates new session
  - **Errors**: `SESSION_NOT_FOUND`, `DEVICE_SWITCH_MISMATCH`

## Stubbed Endpoints (Placeholders - Return Mock Messages)

The following endpoints exist but return placeholder responses. Implementation in progress.

### Students
- `GET /students/me` - Returns mock student object

### Attendance
- `GET /students/{studentId}/attendance` - Placeholder
- `POST /students/{studentId}/attendance` - Placeholder

### Access
- `GET /access/{studentId}` - Placeholder
- `POST /access/check` - Placeholder

### Presence
- `GET /presence/{studentId}` - Placeholder
- `GET /presence/{studentId}/trail` - Placeholder

### Incidents
- `GET /incidents` - Placeholder
- `POST /incidents` - Placeholder

## Not Yet Implemented

The following endpoints are documented in roadmap but not yet built:

- `POST /auth/refresh` - Token rotation
- `POST /admin/students` - Admin student provisioning
- `POST /admin/students/bulk-import` - Bulk student import
- `POST /admin/students/{studentId}/send-activation` - Resend activation
- `GET /students/{studentId}/schedule` - Student timetable
- `GET /reliability/{studentId}` - Reliability score
- `GET /alerts` - Alert list
- Security and admin role-based endpoints

## Request / response examples

### 1) Activate Account

#### Request

```http
POST /auth/activate
Content-Type: application/json

{
  "activationToken": "activation_token_001",
  "password": "newpassword123"
}
```

#### Response (Success: 200 OK)

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

#### Response (Error: Activation token already used)

```json
{
  "error": {
    "code": "ALREADY_ACTIVATED",
    "message": "Account is already activated"
  }
}
```

### 2) Login

#### Request

```http
POST /auth/login
Content-Type: application/json

{
  "identifier": "CS21002",
  "password": "pass456",
  "deviceId": "device-ios-iphone15-001"
}
```

**Note**: `deviceId` is **required**. If omitted, request fails with validation error.

Alternative identifier: `"identifier": "cs21002@campus.edu"` (email also works)

#### Response (Success: 200 OK)

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

#### Response (Error: Device already bound)

```json
{
  "error": {
    "code": "DEVICE_ALREADY_BOUND",
    "message": "Another device is already bound to this account"
  }
}
```

Resolution: Call `/auth/device/switch` to move session or logout first.

### 3) Logout

#### Request

```http
POST /auth/logout
Content-Type: application/json

{
  "studentId": "std_002",
  "deviceId": "device-ios-iphone15-001"
}
```

#### Response (Success: 200 OK)

```json
{
  "message": "Logged out successfully"
}
```

### 4) Device Switch

#### Request

```http
POST /auth/device/switch
Content-Type: application/json

{
  "studentId": "std_002",
  "oldDeviceId": "device-ios-iphone15-001",
  "newDeviceId": "device-android-pixel8-002"
}
```

#### Response (Success: 200 OK)

```json
{
  "accessToken": "new-uuid-token-...",
  "refreshToken": "new-uuid-refresh-...",
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

**Note**: Old session is invalidated; new tokens must be used for subsequent requests.

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|----------|
| `INVALID_CREDENTIALS` | 401 | Email/roll number or password incorrect |
| `ACCOUNT_NOT_ACTIVATED` | 403 | Account status is pending; must activate first |
| `ACCOUNT_NOT_FOUND` | 404 | Student ID not found |
| `SESSION_NOT_FOUND` | 404 | No active session for this student |
| `DEVICE_ALREADY_BOUND` | 409 | Student has active session on another device |
| `DEVICE_SWITCH_MISMATCH` | 409 | Old device ID doesn't match session |
| `INVALID_ACTIVATION_TOKEN` | 400 | Activation token invalid or expired |
| `ALREADY_ACTIVATED` | 409 | Account already activated |
| `VALIDATION_ERROR` | 400 | Request validation failed (missing required fields) |

## Stored Test Accounts

For development/testing, MockAuthStore is seeded with:

| Roll # | Email | Password | Status | Token | Notes |
|--------|-------|----------|--------|-------|-------|
| CS21001 | cs21001@campus.edu | pass123 | pending | activation_token_001 | Must activate before login |
| CS21002 | cs21002@campus.edu | pass456 | active | (none) | Ready to login |

### Testing Flow

1. **Activate CS21001**:
   ```bash
   POST /auth/activate
   { "activationToken": "activation_token_001", "password": "newpass123" }
   ```

2. **Login as CS21002**:
   ```bash
   POST /auth/login
   { "identifier": "CS21002", "password": "pass456", "deviceId": "test-device-1" }
   ```

3. **Try login from different device** (should fail with DEVICE_ALREADY_BOUND):
   ```bash
   POST /auth/login
   { "identifier": "CS21002", "password": "pass456", "deviceId": "test-device-2" }
   ```

4. **Switch device**:
   ```bash
   POST /auth/device/switch
   { "studentId": "std_002", "oldDeviceId": "test-device-1", "newDeviceId": "test-device-2" }
   ```

## Security Notes

- Public self-registration is explicitly forbidden
- Only campus-admin-provisioned accounts can use login/activation flows
  - **Current**: Manual seeding in MockAuthStore; no admin provisioning API yet
  - **Future**: Implement admin provisioning endpoints
- All auth endpoints require TLS (enforced in production)
- One active device per student is enforced at the auth service layer
- Token security is in-progress:
  - **Current state**: Random UUID tokens (development only)
  - **Future state**: JWT with RS256 signing, expiration validation, refresh rotation
- No route protection middleware yet (all routes publicly accessible)
  - **Future**: Add Bearer token validation middleware on protected routes
